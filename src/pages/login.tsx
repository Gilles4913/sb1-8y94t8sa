// src/pages/login.tsx
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '@/lib/supabase'

export default function LoginPage() {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const clickedRef = useRef(false)

  const handleClick = () => {
    clickedRef.current = true
    console.log('[LOGIN] Button clicked')
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('[LOGIN] onSubmit fired')
    setMsg(null)
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      console.log('[LOGIN] signIn data:', data, 'error:', error)
      if (error) throw error

      const { data: sess } = await supabase.auth.getSession()
      console.log('[LOGIN] session after:', sess?.session)

      // route simple : si session OK → /admin sinon /login
      if (sess?.session) {
        nav('/admin', { replace: true })
      } else {
        setMsg('Session absente après connexion — vérifiez la config Auth/URL')
      }
    } catch (e: any) {
      console.error('[LOGIN] error:', e)
      const base = e?.message || 'Échec de la connexion'
      const code = e?.status || e?.code || ''
      setMsg(code ? `${base} (code: ${code})` : base)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="rounded-lg border bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      style={{ position: 'relative', zIndex: 10, pointerEvents: 'auto' }}
    >
      <h1 className="mb-4 text-xl font-semibold">Connexion (mode test)</h1>

      <div className="mb-3 text-xs text-gray-500 dark:text-gray-400">
        Si rien ne se passe quand vous cliquez, un overlay invisible bloque peut-être les clics.
      </div>

      {msg && (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700 dark:bg-red-900/30 dark:border-red-900">
          {msg}
        </div>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-3" autoComplete="off">
        <input
          className="rounded border px-3 py-2 text-sm dark:bg-zinc-800 dark:border-zinc-700 dark:text-gray-100"
          type="email"
          placeholder="Email"
          inputMode="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          data-testid="email"
        />

        <input
          className="rounded border px-3 py-2 text-sm dark:bg-zinc-800 dark:border-zinc-700 dark:text-gray-100"
          type="password"
          placeholder="Mot de passe"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          data-testid="password"
        />

        <button
          className="rounded-md bg-gray-900 px-3 py-2 text-sm text-white hover:bg-black disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
          type="submit"
          disabled={loading}
          onClick={handleClick}
          data-testid="submit"
          style={{ position: 'relative', zIndex: 20, pointerEvents: 'auto' }}
        >
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>

      <div className="mt-4 text-xs">
        <div>Test clic enregistré : <b>{String(clickedRef.current)}</b></div>
        <div>Éléments à vérifier :</div>
        <ul className="list-inside list-disc">
          <li>La console doit afficher “[LOGIN] Button clicked” puis “[LOGIN] onSubmit fired”.</li>
          <li>Dans l’onglet Réseau, une requête doit partir vers <code>/auth/v1/token?grant_type=password</code>.</li>
        </ul>
      </div>
    </div>
  )
}
