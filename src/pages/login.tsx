import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'
import LoginSafety from '@/components/auth/LoginSafety'

export default function LoginPage() {
  // ...
  return (
    <div className="mx-auto mt-10 w-full max-w-md rounded-lg border bg-white p-6 dark:bg-zinc-950 dark:border-zinc-800">
      <LoginSafety />  {/* ← purge immédiate, n’empêche pas le rendu */}
      {/* ... le reste du formulaire ... */}
    </div>
  )
}

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
)

async function getUserRole(): Promise<'super_admin'|'club_admin'|null> {
  const { data: me } = await supabase.auth.getUser()
  const uid = me.user?.id
  if (!uid) return null
  const { data } = await supabase.from('app_users').select('role').eq('id', uid).single()
  return (data?.role as any) ?? null
}

export default function LoginPage() {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sessionEmail, setSessionEmail] = useState<string | null>(null)
  const emailRef = useRef<HTMLInputElement | null>(null)

  // Diagnostic : si une session existe encore, on l’indique et on propose "Changer de compte"
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser()
      const currentEmail = data.user?.email ?? null
      setSessionEmail(currentEmail)
      // Focus direct sur le champ email pour être sûr de pouvoir le modifier immédiatement
      setTimeout(() => emailRef.current?.focus(), 0)
    })()
  }, [])

  const hardClearSession = async () => {
    try { await supabase.auth.signOut() } catch {}
    try {
      const keys = Object.keys(localStorage)
      for (const k of keys) {
        if (k.startsWith('sb-') || k === 'activeTenantId' || k === 'activeTenantName') {
          localStorage.removeItem(k)
        }
      }
      // on garde éventuellement la préférence de thème
    } catch {}
    setSessionEmail(null)
    setEmail('')
    setPassword('')
    setMsg(null)
    // re-focus
    setTimeout(() => emailRef.current?.focus(), 0)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null); setLoading(true)
    try {
      // important : forcer la sortie d’une session résiduelle avant de tenter un nouveau login
      await supabase.auth.signOut().catch(() => {})

      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      // clean impersonation si existait
      localStorage.removeItem('activeTenantId')
      localStorage.removeItem('activeTenantName')

      const role = await getUserRole()
      if (role === 'super_admin') nav('/admin', { replace: true })
      else nav('/clubs', { replace: true })
    } catch (e: any) {
      setMsg(e.message || 'Échec de la connexion')
    } finally { setLoading(false) }
  }

  const clearForm = () => {
    setEmail('')
    setPassword('')
    setMsg(null)
    setTimeout(() => emailRef.current?.focus(), 0)
  }

  return (
    <div className="mx-auto mt-10 w-full max-w-md rounded-lg border bg-white p-6 text-gray-900 dark:bg-zinc-950 dark:text-gray-100 dark:border-zinc-800">
      <h1 className="mb-4 text-xl font-semibold">Connexion</h1>

      {sessionEmail && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-900/20 dark:border-amber-900">
          Vous êtes (ou étiez) connecté en tant que <b>{sessionEmail}</b>.
          <br />
          Si vous souhaitez utiliser un autre compte, cliquez ci-dessous :
          <div className="mt-2">
            <button
              onClick={hardClearSession}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-amber-100 dark:hover:bg-zinc-800"
            >
              Changer de compte (déconnexion + nettoyage)
            </button>
          </div>
        </div>
      )}

      {msg && (
        <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700 dark:bg-red-900/30 dark:border-red-900">
          {msg}
        </div>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-3" autoComplete="off">
        <input
          ref={emailRef}
          className="rounded border px-3 py-2 text-sm dark:bg-zinc-900 dark:border-zinc-700 dark:text-gray-100"
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
        />

        <input
          className="rounded border px-3 py-2 text-sm dark:bg-zinc-900 dark:border-zinc-700 dark:text-gray-100"
          type="password"
          placeholder="Mot de passe"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="flex items-center gap-2">
          <button
            className="rounded-md bg-gray-900 px-3 py-2 text-sm text-white hover:bg-black disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
          <button
            className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800"
            type="button"
            onClick={clearForm}
          >
            Vider le formulaire
          </button>
        </div>
      </form>
    </div>
  )
}
