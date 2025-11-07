import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import { ClubActions } from '@/components/admin/ClubActions'
import { useTenant } from '@/contexts/TenantContext'
import { useNavigate } from 'react-router-dom'

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
  const [q, setQ] = useState('')
  const { setActiveTenant } = useTenant()
  const navigate = useNavigate()

  const load = async () => {
    setErr(null); setLoading(true)
    try {
      // 1) clubs
      const { data: clubs, error } = await supabase
        .from('tenants')
        .select('id,name,email_contact,status,phone,address,created_at')
        .order('created_at', { ascending: false })
      if (error) throw error

      // 2) admin email par tenant
      const ids = (clubs || []).map(c => c.id)
      let adminByTenant: Record<string,string|undefined> = {}
      if (ids.length) {
        const { data: admins, error: e2 } = await supabase
          .from('app_users')
          .select('email, tenant_id, role')
          .in('tenant_id', ids)
        if (e2) throw e2
        ;(admins || []).forEach((u: any) => {
          if (u.role === 'club_admin') adminByTenant[u.tenant_id] = u.email
        })
      }

      setRows((clubs || []).map((c: any) => ({ ...c, admin_email: adminByTenant[c.id] })))
    } catch (e:any) {
      setErr(e.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    if (!q.trim()) return rows
    const s = q.toLowerCase()
    return rows.filter(r =>
      `${r.name} ${r.email_contact ?? ''} ${r.admin_email ?? ''}`.toLowerCase().includes(s)
    )
  }, [rows, q])

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Clubs</h1>

      <div className="mb-4 flex items-center gap-3">
        <input
          className="w-full max-w-md rounded-md border px-3 py-2 text-sm"
          placeholder="Rechercher un club ou un email…"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <button className="rounded-md border px-3 py-2 text-sm" onClick={load}>Rafraîchir</button>
      </div>

      {err && <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>}

      {loading ? <p>Chargement…</p> : (
        <div className="overflow-auto rounded-lg border">
          <table className="w-full min-w-[980px] border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left text-sm font-medium">Nom</th>
                <th className="p-3 text-left text-sm font-medium">Email contact</th>
                <th className="p-3 text-left text-sm font-medium">Admin</th>
                <th className="p-3 text-left text-sm font-medium">Statut</th>
                <th className="p-3 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="p-3">{r.name}</td>
                  <td className="p-3">{r.email_contact || '—'}</td>
                  <td className="p-3">{r.admin_email || '—'}</td>
                  <td className="p-3">{r.status}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center gap-10">
                      <button
                        className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50"
                        onClick={() => {
                          setActiveTenant({ id: r.id, name: r.name })
                          navigate('/club') // route dashboard club
                        }}
                      >
                        Voir l’environnement club
                      </button>

                      <ClubActions
                        tenantId={r.id}
                        adminEmail={r.admin_email || undefined}
                        status={r.status}
                        clubName={r.name}
                        onChanged={load}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr><td className="p-3" colSpan={5}>Aucun club</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
