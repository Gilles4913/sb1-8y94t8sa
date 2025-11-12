import { Link, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')
}

function loadTheme(): Theme {
  const saved = localStorage.getItem('theme') as Theme | null
  if (saved === 'dark' || saved === 'light') return saved
  // défaut: dark
  return 'dark'
}

export default function TopNav() {
  const [theme, setTheme] = useState<Theme>('dark')
  const loc = useLocation()

  // Init au mount + à chaque navigation (pour éviter les flashes)
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

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/90 backdrop-blur dark:bg-slate-900/80 dark:border-slate-800">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* LOGO / MARQUE */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            {/* petit logo simple */}
            <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-blue-600 text-white dark:bg-emerald-500">
              A
            </span>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              A2Display
            </span>
          </Link>
        </div>

        {/* ACTIONS DROITE */}
        <div className="flex items-center gap-2">
          {/* Bouton thème */}
          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Passer en thème clair' : 'Passer en thème sombre'}
            className="inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-800"
            title={theme === 'dark' ? 'Thème : sombre (cliquer pour clair)' : 'Thème : clair (cliquer pour sombre)'}
          >
            {theme === 'dark' ? (
              // icône lune (thème sombre actif)
              <svg width="16" height="16" viewBox="0 0 24 24" className="fill-current">
                <path d="M21 12.79A9 9 0 0 1 11.21 3a.75.75 0 0 0-.92.92A7.5 7.5 0 1 0 20.08 12.7a.75.75 0 0 0 .92.09Z" />
              </svg>
            ) : (
              // icône soleil (thème clair actif)
              <svg width="16" height="16" viewBox="0 0 24 24" className="fill-current">
                <path d="M6.76 4.84 5.34 3.42 3.92 4.84l1.42 1.42L6.76 4.84Zm10.48 0 1.42-1.42 1.42 1.42-1.42 1.42-1.42-1.42ZM12 4V2h-0v2h0Zm8 8h2v0h-2v0ZM12 22v-2h0v2h0ZM2 12H0v0h2v0Zm3.34 6.24L4.92 19.66l1.42 1.42 1.42-1.42-1.42-1.42Zm12.72 0 1.42 1.42 1.42-1.42-1.42-1.42-1.42 1.42ZM12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z" />
              </svg>
            )}
            <span className="hidden sm:inline">
              {theme === 'dark' ? 'Sombre' : 'Clair'}
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}
