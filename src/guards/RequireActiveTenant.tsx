import { Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useTenant } from '@/contexts/TenantContext'
import { getCurrentRole, isAuthenticated } from '@/lib/auth'

export default function RequireActiveTenant({ children }: { children: JSX.Element }) {
  const { activeTenant, loading } = useTenant()
  const [state, setState] = useState<'checking' | 'ok' | 'to-login' | 'to-choose' | 'to-login-orphan'>('checking')

  useEffect(() => {
    (async () => {
      const authed = await isAuthenticated()
      if (!authed) { setState('to-login'); return }

      if (loading) { setState('checking'); return }

      if (activeTenant) { setState('ok'); return }

      const role = await getCurrentRole()
      if (role === 'super_admin') {
        // super_admin sans impersonation : on ouvre la page de choix
        setState('to-choose')
      } else if (role === 'club_admin') {
        // club_admin sans tenant => compte mal configuré
        setState('to-login-orphan')
      } else {
        setState('to-login')
      }
    })()
  }, [activeTenant, loading])

  if (state === 'checking') return <div className="p-6">Chargement…</div>
  if (state === 'to-login')  return <Navigate to="/login" replace />
  if (state === 'to-choose') return <Navigate to="/clubs/choose" replace />
  if (state === 'to-login-orphan') return <Navigate to="/login" replace />
  return children
}
