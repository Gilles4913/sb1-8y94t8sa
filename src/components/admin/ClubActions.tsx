import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
)

async function callManage(tenantId: string, action: 'suspend'|'restore'|'delete_hard') {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Session invalide')

  const res = await fetch('/api/admin/tenants/manage', {
    method: 'POST',
    headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ tenant_id: tenantId, action })
  })
  const json = await res.json()
  if (!res.ok || !json.ok) throw new Error(json.message || 'Action échouée')
  return json
}

async function resendInvite(adminEmail: string, tenantId?: string) {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Session invalide')

  const res = await fetch('/api/admin/resend-invite', {
    method: 'POST',
    headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ admin_email: adminEmail, tenant_id: tenantId })
  })
  const json = await res.json()
  if (!res.ok || !json.ok) throw new Error(json.message || 'Renvoi invitation échoué')
  return json
}

export function ClubActions({
  tenantId,
  adminEmail,
  status,
  onChanged
}: {
  tenantId: string
  adminEmail?: string
  status?: 'active'|'inactive'
  onChanged?: () => void
}) {
  const [busy, setBusy] = useState<'suspend'|'restore'|'delete'|'invite'|null>(null)
  const [msg, setMsg] = useState<string| null>(null)

  const doSuspend = async () => {
    setMsg(null); setBusy('suspend')
    try { await callManage(tenantId,'suspend'); setMsg('Club suspendu'); onChanged?.() } 
    catch (e:any){ setMsg(e.message) } finally { setBusy(null) }
  }
  const doRestore = async () => {
    setMsg(null); setBusy('restore')
    try { await callManage(tenantId,'restore'); setMsg('Club réactivé'); onChanged?.() } 
    catch (e:any){ setMsg(e.message) } finally { setBusy(null) }
  }
  const doDelete = async () => {
    if (!confirm('⚠️ Suppression DÉFINITIVE de ce club et de toutes ses données. Continuer ?')) return
    const name = prompt('Tapez "SUPPRIMER" pour confirmer :')
    if (name !== 'SUPPRIMER') return
    setMsg(null); setBusy('delete')
    try { await callManage(tenantId,'delete_hard'); setMsg('Club supprimé définitivement'); onChanged?.() } 
    catch (e:any){ setMsg(e.message) } finally { setBusy(null) }
  }
  const doInvite = async () => {
    if (!adminEmail) { setMsg('Aucun email admin'); return }
    setMsg(null); setBusy('invite')
    try { await resendInvite(adminEmail, tenantId); setMsg('Invitation renvoyée') } 
    catch (e:any){ setMsg(e.message) } finally { setBusy(null) }
  }

  return (
    <div style={{display:'flex', gap:8, alignItems:'center'}}>
      {status === 'active' ? (
        <button disabled={busy!==null} onClick={doSuspend}>
          {busy==='suspend' ? '…' : 'Suspendre'}
        </button>
      ) : (
        <button disabled={busy!==null} onClick={doRestore}>
          {busy==='restore' ? '…' : 'Réactiver'}
        </button>
      )}
      <button disabled={busy!==null || !adminEmail} onClick={doInvite}>
        {busy==='invite' ? '…' : 'Renvoyer invitation'}
      </button>
      <button disabled={busy!==null} onClick={doDelete} style={{color:'#b00020'}}>
        {busy==='delete' ? '…' : 'Supprimer définitivement'}
      </button>
      {msg && <small style={{marginLeft:8}}>{msg}</small>}
    </div>
  )
}
