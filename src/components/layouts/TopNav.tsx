import { Link, NavLink } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { useEffect, useState } from 'react'
import { getCurrentRole } from '@/lib/auth'
import { useTenant } from '@/contexts/TenantContext'

export default function TopNav() {
  const { theme, toggle } = useTheme()
  const { activeTenant } = useTenant()
  const [role, setRole] = useState<'super_admin' | 'club_admin' | null>(null)

  useEffect(() => {
    (async () => setRole(await getCurrentRole()))()
  }, [])

  const item = (to: string, label: string) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `rounded-md px-3 py-1.5 text-sm ${isActive
          ? 'bg-gray-900 text-white dark:bg-white dark:text-black'
          : 'text-gray-800 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-zinc-800'}`
      }
    >{label}</NavLink>
  )

  return (
    <header className="w-full border-b bg-white dark:bg-zinc-900 dark:border-zinc-800">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
        <Link to="/" className="font-semibold text-gray-900 dark:text-gray-100">Sponsor Manager</Link>
        <nav className="flex items-center gap-2">
          {/* Affiche Admin seulement si super_admin */}
          {role === 'super_admin' && item('/admin', 'Admin')}
          {/* Affiche Club si club_admin ou super_admin avec impersonation active */}
          {(role === 'club_admin' || (role === 'super_admin' && !!activeTenant)) && item('/clubs', 'Club')}
          <button onClick={toggle} className="rounded-md px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-zinc-800">
            Thème : {theme === 'dark' ? 'Sombre' : 'Clair'}
          </button>
          {item('/logout', 'Déconnexion')}
        </nav>
      </div>
    </header>
  )
}
