import { Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useTenant } from '@/contexts/TenantContext'
import { getCurrentRole, isAuthenticated } from '@/lib/auth'

export default function RequireActiveTenant({ children }: { children: JSX.Element }) {
  const { activeTenant, loading } = useTenant()
  const [state, setState] = useState<'checking' | 'ok' | 'to-login' | 'to-admin' | 'to-login-orphan'>('checking')

  useEffect(() => {
    (async () => {
      // 1) pas de session → /login
      const authed = await isAuthenticated()
      if (!authed) { setState('to-login'); return }

      // 2) si tenant context est en cours → attendre
      if (loading) { setState('checking'); return }

      // 3) tenant présent → ok
      if (activeTenant) { setState('ok'); return }

      // 4) pas de tenant : regarder le rôle
      const role = await getCurrentRole()
      if (role === 'super_admin') {
        // super_admin sans impersonation : on renvoie vers admin
        setState('to-admin')
      } else if (role === 'club_admin') {
        // club_admin sans tenant → données/profil incomplet : on peut renvoyer /login ou une page d’erreur dédiée
        setState('to-login-orphan')
      } else {
        setState('to-login')
      }
    })()
  }, [activeTenant, loading])

  if (state === 'checking') return <div className="p-6">Chargement…</div>
  if (state === 'to-login')  return <Navigate to="/login" replace />
  if (state === 'to-admin')  return <Navigate to="/admin" replace />
  if (state === 'to-login-orphan') {
    // si tu veux, remplace par une page d’aide : “votre compte n’est lié à aucun club, contactez l’admin”
    return <Navigate to="/login" replace />
  }
  return children
}
