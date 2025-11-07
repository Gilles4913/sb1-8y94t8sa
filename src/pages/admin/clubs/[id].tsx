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

  const load = async () => {
    if (!id) return
    setErr(null)
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
      setAdminEmail(admins?.find(u => u.role === 'club_admin')?.email)
    } catch (e:any) {
      setErr(e.message || String(e))
    }
  }

  useEffect(() => { load() }, [id])

  if (!id) return <div>Manque id</div>

  return (
    <div style={{padding:24}}>
      <h1>Détails du club</h1>
      {err && <div style={{color:'#b00020'}}>{err}</div>}
      {!club ? <p>Chargement…</p> : (
        <>
          <p><b>Nom : </b>{club.name}</p>
          <p><b>Contact : </b>{club.email_contact || '—'}</p>
          <p><b>Statut : </b>{club.status}</p>
          <p><b>Admin : </b>{adminEmail || '—'}</p>

          <div style={{marginTop:16}}>
            <ClubActions
              tenantId={id}
              adminEmail={adminEmail}
              status={club.status}
              onChanged={load}
            />
          </div>
        </>
      )}
    </div>
  )
}
