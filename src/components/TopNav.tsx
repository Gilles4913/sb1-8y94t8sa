import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import supabase from '@/lib/supabase'
import { useTenant } from '@/contexts/TenantContext'

type Theme = 'light' | 'dark'

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')
}
function loadTheme(): Theme {
  const saved = localStorage.getItem('theme') as Theme | null
  return saved === 'light' || saved === 'dark' ? saved : 'dark'
}

export default function TopNav() {
  const [theme, setTheme] = useState<Theme>('dark')
  const loc = useLocation()
  const nav = useNavigate()
  const { clearTenant } = useTenant()

  useEffect(() => {
    const t = loadTheme()
    setTheme(t)
    applyTheme(t)
  }, [loc.pathname])

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('theme', next)
    applyTheme(next)
  }

  const logout = async () => {
    await supabase.auth.signOut()
    clearTenant()
    nav('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/90 backdrop-blur dark:bg-slate-900/80 dark:border-slate-800">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-blue-600 text-white dark:bg-emerald-500">
              A
            </span>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              A2Display
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-800"
            title={theme === 'dark' ? 'Thème : sombre (cliquer pour clair)' : 'Thème : clair (cliquer pour sombre)'}
          >
            {theme === 'dark' ? 'Sombre' : 'Clair'}
          </button>

          <button
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-800"
            title="Se déconnecter"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </header>
  )
}
