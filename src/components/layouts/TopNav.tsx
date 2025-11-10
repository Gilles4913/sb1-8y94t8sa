import { Link, NavLink } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'
import { useTheme } from '@/contexts/ThemeContext'

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL!, import.meta.env.VITE_SUPABASE_ANON_KEY!)

export default function TopNav() {
  const { theme, toggle } = useTheme()

  const logout = async () => {
    try {
      // 1) Déconnexion Supabase (session en cours)
      await supabase.auth.signOut()
    } catch {}
    try {
      // 2) Purge de toutes les traces locales liées à l’app
      const toRemove = Object.keys(localStorage).filter(k =>
        k.startsWith('sb-') ||              // sessions supabase
        k === 'activeTenantId' ||
        k === 'activeTenantName'
      )
      toRemove.forEach(k => localStorage.removeItem(k))
      // (on garde la préférence de thème)
    } catch {}
    // 3) Redirection dure (reset complet de l'état React)
    window.location.href = '/login'
  }

  const item = (to: string, label: string) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `rounded-md px-3 py-1.5 text-sm
         ${isActive
            ? 'bg-gray-900 text-white dark:bg-white dark:text-black'
            : 'text-gray-800 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-zinc-800'}`
      }
    >
      {label}
    </NavLink>
  )

  return (
    <header className="w-full border-b bg-white dark:bg-zinc-900 dark:border-zinc-800">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
        <Link to="/" className="font-semibold text-gray-900 dark:text-gray-100">Sponsor Manager</Link>
        <nav className="flex items-center gap-2">
          {item('/admin', 'Admin')}
          {item('/clubs', 'Club')}
          {item('/clubs/sponsors', 'Sponsors')}
          <button
            onClick={toggle}
            className="rounded-md px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-zinc-800"
            title={`Basculer le thème (actuel : ${theme})`}
          >
            Thème : {theme === 'dark' ? 'Sombre' : 'Clair'}
          </button>
          <button
            onClick={logout}
            className="rounded-md px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-zinc-800"
          >
            Déconnexion
          </button>
        </nav>
      </div>
    </header>
  )
}
