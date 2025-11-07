import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { ClubActions } from '@/components/admin/ClubActions'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
)

type ClubRow = {
  id: string
  name: string
  email_contact: string | null
  status: 'active'|'inactive'
  phone: string | null
  address: string | null
  admin_email?: string | null
}

export default function AdminClubsPage() {
  const [rows, setRows] = useState<ClubRow[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string|null>(null)

  const load = async () => {
    setErr(null); setLoading(true)
    try {
      // clubs
      const { data: clubs, error } = await supabase
        .from('tenants')
        .select('id,name,email_contact,status,phone,address')
        .order('created_at', { ascending: false })
      if (error) throw error

      // admin email: on va chercher le(s) app_users club_admin pour chaque tenant
      const ids = (clubs || []).map(c => c.id)
      let adminByTenant: Record<string,string|undefined> = {}
      if (ids.length) {
        const { data: admins, error: e2 } = await supabase
          .from('app_users')
          .select('email, tenant_id, role')
          .in('tenant_id', ids)
        if (e2) throw e2
        admins?.forEach(u => {
          if (u.role === 'club_admin') adminByTenant[u.tenant_id!] = u.email
        })
      }

      setRows((clubs || []).map(c => ({ ...c, admin_email: adminByTenant[c.id] })))
    } catch (e:any) {
      setErr(e.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div style={{padding:24}}>
      <h1>Clubs</h1>
      {err && <div style={{color:'#b00020'}}>{err}</div>}
      {loading ? <p>Chargement…</p> : (
        <table width="100%" cellPadding={8} style={{borderCollapse:'collapse'}}>
          <thead>
            <tr>
              <th align="left">Nom</th>
              <th align="left">Email contact</th>
              <th align="left">Admin</th>
              <th align="left">Statut</th>
              <th align="left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} style={{borderTop:'1px solid #eee'}}>
                <td>{r.name}</td>
                <td>{r.email_contact || '—'}</td>
                <td>{r.admin_email || '—'}</td>
                <td>{r.status}</td>
                <td>
                  <ClubActions
                    tenantId={r.id}
                    adminEmail={r.admin_email || undefined}
                    status={r.status}
                    onChanged={load}
                  />
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={5}>Aucun club</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}
