import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
)

export default function RequireSuperAdmin({ children }: { children: JSX.Element }) {
  const [ok, setOk] = useState<boolean|null>(null)

  useEffect(() => {
    (async () => {
      const { data: me } = await supabase.auth.getUser()
      const uid = me.user?.id
      if (!uid) { setOk(false); return }
      const { data, error } = await supabase
        .from('app_users').select('role').eq('id', uid).single()
      if (error) { setOk(false); return }
      setOk(data?.role === 'super_admin')
    })()
  }, [])

  if (ok === null) return <div className="p-6">Chargement…</div>
  if (!ok) return <Navigate to="/login" replace />
  return children
}
