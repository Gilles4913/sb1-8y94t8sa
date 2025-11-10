import { useState } from 'react'
import supabase from '@/lib/supabase'
import ConfirmDialog from '@/components/ui/ConfirmDialog'


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
  clubName,
  onChanged
}: {
  tenantId: string
  adminEmail?: string
  status?: 'active'|'inactive'
  clubName?: string
  onChanged?: () => void
}) {
  const [busy, setBusy] = useState<'suspend'|'restore'|'delete'|'invite'|null>(null)
  const [msg, setMsg] = useState<string| null>(null)
  const [confirmHardOpen, setConfirmHardOpen] = useState(false)
  const [confirmSuspendOpen, setConfirmSuspendOpen] = useState(false)
  const [confirmRestoreOpen, setConfirmRestoreOpen] = useState(false)
  const [confirmValue, setConfirmValue] = useState('')

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
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-8">
        {status === 'active' ? (
          <button
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
            disabled={busy!==null}
            onClick={() => setConfirmSuspendOpen(true)}
          >
            Suspendre
          </button>
        ) : (
          <button
            className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
            disabled={busy!==null}
            onClick={() => setConfirmRestoreOpen(true)}
          >
            Réactiver
          </button>
        )}

        <button
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
          disabled={busy!==null || !adminEmail}
          onClick={doInvite}
        >
          {busy==='invite' ? 'Envoi…' : 'Renvoyer invitation'}
        </button>

        <button
          className="rounded-md border px-3 py-1.5 text-sm text-red-700 hover:bg-red-50"
          disabled={busy!==null}
          onClick={() => { setConfirmValue(''); setConfirmHardOpen(true) }}
        >
          Supprimer définitivement
        </button>
      </div>

      {msg && <small className="text-gray-700">{msg}</small>}

      {/* Confirm suspend */}
      <ConfirmDialog
        open={confirmSuspendOpen}
        title="Suspendre le club"
        description={`Le club ${clubName ?? ''} sera désactivé (accès bloqué). Vous pourrez le réactiver plus tard.`}
        confirmLabel="Suspendre"
        onCancel={() => setConfirmSuspendOpen(false)}
        onConfirm={() => { setConfirmSuspendOpen(false); doSuspend() }}
      />

      {/* Confirm restore */}
      <ConfirmDialog
        open={confirmRestoreOpen}
        title="Réactiver le club"
        description={`Le club ${clubName ?? ''} sera réactivé et retrouvera l'accès.`}
        confirmLabel="Réactiver"
        onCancel={() => setConfirmRestoreOpen(false)}
        onConfirm={() => { setConfirmRestoreOpen(false); doRestore() }}
      />

      {/* Confirm hard delete */}
      <ConfirmDialog
        open={confirmHardOpen}
        title="Supprimer définitivement"
        description={`⚠️ Action irréversible : toutes les données liées au club ${clubName ?? ''} seront supprimées (sponsors, campagnes, pledges, invitations, app_users, etc.).`}
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        danger
        onCancel={() => setConfirmHardOpen(false)}
        onConfirm={() => {
          if (confirmValue !== 'SUPPRIMER') return
          setConfirmHardOpen(false)
          doDelete()
        }}
      >
        <div className="mt-3">
          <label className="text-sm">Tapez <b>SUPPRIMER</b> pour confirmer :</label>
          <input
            className="mt-2 w-full rounded-md border px-3 py-2 text-sm"
            value={confirmValue}
            onChange={e => setConfirmValue(e.target.value)}
            placeholder="SUPPRIMER"
          />
        </div>
      </ConfirmDialog>
    </div>
  )
}
