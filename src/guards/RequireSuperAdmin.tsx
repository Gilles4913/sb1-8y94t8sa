import { Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getCurrentRole, isAuthenticated } from '@/lib/auth'

export default function RequireSuperAdmin({ children }: { children: JSX.Element }) {
  const [state, setState] = useState<'checking' | 'ok' | 'to-login' | 'to-clubs'>('checking')

  useEffect(() => {
    (async () => {
      const authed = await isAuthenticated()
      if (!authed) { setState('to-login'); return }

      const role = await getCurrentRole()
      if (role === 'super_admin') setState('ok')
      else setState('to-clubs') // 🔁 club_admin → jamais /login, on renvoie vers /clubs
    })()
  }, [])

  if (state === 'checking') return <div className="p-6">Chargement…</div>
  if (state === 'to-login')  return <Navigate to="/login" replace />
  if (state === 'to-clubs')  return <Navigate to="/clubs" replace />
  return children
}
