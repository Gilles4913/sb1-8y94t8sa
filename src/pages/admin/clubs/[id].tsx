import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'
import { ClubActions } from '@/components/admin/ClubActions'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
)

export default function ClubDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [club, setClub] = useState<any>(null)
  const [adminEmail, setAdminEmail] = useState<string|undefined>()
  const [err, setErr] = useState<string|null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    if (!id) return
    setErr(null); setLoading(true)
    try {
      const { data: t, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error

      const { data: admins, error: e2 } = await supabase
        .from('app_users')
        .select('email, role')
        .eq('tenant_id', id)
      if (e2) throw e2

      setClub(t)
      setAdminEmail(admins?.find(u => (u as any).role === 'club_admin')?.email)
    } catch (e:any) {
      setErr(e.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  if (!id) return <div className="p-6">ID club manquant</div>

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Détails du club</h1>
      {err && <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>}
      {loading ? <p>Chargement…</p> : !club ? <p>Club introuvable</p> : (
        <>
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <div className="text-sm text-gray-500">Nom</div>
              <div className="text-base">{club.name}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Email contact</div>
              <div className="text-base">{club.email_contact || '—'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Téléphone</div>
              <div className="text-base">{club.phone || '—'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Adresse</div>
              <div className="text-base">{club.address || '—'}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Statut</div>
              <div className="text-base">{club.status}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Admin</div>
              <div className="text-base">{adminEmail || '—'}</div>
            </div>
          </div>

          <div className="mt-4">
            <ClubActions
              tenantId={id}
              adminEmail={adminEmail}
              status={club.status}
              clubName={club.name}
              onChanged={load}
            />
          </div>
        </>
      )}
    </div>
  )
}
