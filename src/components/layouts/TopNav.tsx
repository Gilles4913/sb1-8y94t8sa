import { Link, NavLink } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'

export default function TopNav() {
  const { theme, toggle } = useTheme()
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
          {item('/admin', 'Admin')}
          {item('/clubs', 'Club')}
          <button onClick={toggle} className="rounded-md px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-zinc-800">
            Thème : {theme === 'dark' ? 'Sombre' : 'Clair'}
          </button>
          {item('/logout', 'Déconnexion')}
        </nav>
      </div>
    </header>
  )
}
