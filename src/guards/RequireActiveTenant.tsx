import { Navigate, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import supabase from '@/lib/supabase'
import { useTenant } from '@/contexts/TenantContext'

export default function RequireActiveTenant() {
  const { tenant } = useTenant()
  const [role, setRole] = useState<'super_admin' | 'club_admin' | null>(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    (async () => {
      setChecking(true)
      const { data } = await supabase.auth.getUser()
      const uid = data.user?.id
      if (!uid) { setRole(null); setChecking(false); return }
      const { data: row } = await supabase.from('app_users').select('role').eq('id', uid).single()
      setRole((row?.role as any) ?? null)
      setChecking(false)
    })()
  }, [])

  if (checking) return <div className="p-6">Chargement…</div>

  // non connecté → login
  if (!role) return <Navigate to="/login" replace />

  // connecté mais pas de tenant → si super_admin : invite à choisir un club
  if (!tenant) {
    if (role === 'super_admin') {
      return (
        <div className="max-w-3xl mx-auto p-6">
          <div className="card p-4">
            <div className="mb-2 text-lg font-semibold">Aucun club sélectionné</div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Rendez-vous dans <strong>Admin → Clubs</strong> puis cliquez sur <em>Basculer</em> sur un club.
            </p>
          </div>
        </div>
      )
    }
    // club_admin sans tenant (rare) → on bloque proprement
    return <div className="p-6 text-amber-700">Aucun accès club configuré pour ce compte.</div>
  }

  return <Outlet />
}
