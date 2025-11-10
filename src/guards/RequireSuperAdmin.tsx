import { Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import supabase from '@/lib/supabase'

export default function RequireSuperAdmin({ children }: { children: JSX.Element }) {
  const [ok, setOk] = useState<boolean | null>(null)

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser()
      const uid = data.user?.id
      if (!uid) { setOk(false); return }
      const { data: row } = await supabase.from('app_users').select('role').eq('id', uid).single()
      setOk(row?.role === 'super_admin')
    })()
  }, [])

  if (ok === null) return <div className="p-6">Chargement…</div>
  if (!ok) return <Navigate to="/login" replace />
  return children
}
