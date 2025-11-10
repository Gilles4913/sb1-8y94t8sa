import { useNavigate, Link } from 'react-router-dom'
import { useTenant } from '@/contexts/TenantContext'
import supabase from '@/lib/supabase'

export default function TopNav() {
  const nav = useNavigate()
  const { tenant, clearTenant } = useTenant()

  const logout = async () => {
    await supabase.auth.signOut()
    clearTenant()
    nav('/login', { replace: true })
  }

  return (
    <nav className="flex items-center justify-between bg-gray-900 px-4 py-3 text-white">
      <div className="flex items-center gap-4">
        <Link to="/admin" className="font-semibold hover:underline">
          A2Display
        </Link>
        {tenant ? (
          <span className="text-sm text-gray-300">
            Mode super_admin — Environnement du club : <b>{tenant.name}</b>
          </span>
        ) : (
          <span className="text-sm text-gray-400">Mode Super-Admin</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {tenant && (
          <button
            onClick={clearTenant}
            className="rounded bg-gray-700 px-3 py-1 text-xs hover:bg-gray-600"
          >
            Quitter le mode club
          </button>
        )}
        <button
          onClick={logout}
          className="rounded bg-red-600 px-3 py-1 text-xs hover:bg-red-700"
        >
          Déconnexion
        </button>
      </div>
    </nav>
  )
}
