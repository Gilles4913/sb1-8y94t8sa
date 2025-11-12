import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import supabase from '@/lib/supabase'
import { useTenant } from '@/contexts/TenantContext'

export default function LoginPage() {
  const nav = useNavigate()
  const { tenant } = useTenant()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  // si déjà connecté → redirige vers l’endroit logique
  useEffect(() => {
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        // on lit le rôle
        const { data: me } = await supabase.auth.getUser()
        const uid = me.user?.id
        let role: 'super_admin' | 'club_admin' | null = null
        if (uid) {
          const { data: row } = await supabase.from('app_users').select('role').eq('id', uid).single()
          role = (row?.role as any) ?? null
        }
        if (role === 'super_admin') {
          // si un tenant actif existe → club, sinon admin
          if (tenant) nav('/clubs', { replace: true })
          else nav('/admin', { replace: true })
          return
        }
        if (role === 'club_admin') {
          nav('/clubs', { replace: true })
          return
        }
      }
      setReady(true)
    })()
  }, [nav, tenant])

  const login = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setErr(error.message)
      setLoading(false)
      return
    }
    // post-login : route logique (rôle + tenant)
    const { data: me } = await supabase.auth.getUser()
    const uid = me.user?.id
    let role: 'super_admin' | 'club_admin' | null = null
    if (uid) {
      const { data: row } = await supabase.from('app_users').select('role').eq('id', uid).single()
      role = (row?.role as any) ?? null
    }
    setLoading(false)
    if (role === 'super_admin') {
      if (tenant) nav('/clubs', { replace: true })
      else nav('/admin', { replace: true })
    } else {
      nav('/clubs', { replace: true })
    }
  }

  if (!ready) return <div className="p-6">Chargement…</div>

  return (
    <div className="min-h-[70vh] grid place-items-center px-4">
      <div className="card w-full max-w-md p-6">
        <h1 className="text-xl font-semibold mb-4">Connexion</h1>
        {err && <div className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-red-700">{err}</div>}
        <form onSubmit={login} className="space-y-3">
          <div>
            <label className="text-sm text-slate-600 dark:text-slate-300">Email</label>
            <input
              type="email"
              className="mt-1 w-full rounded border px-3 py-2 dark:bg-slate-900 dark:border-slate-700"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm text-slate-600 dark:text-slate-300">Mot de passe</label>
            <input
              type="password"
              className="mt-1 w-full rounded border px-3 py-2 dark:bg-slate-900 dark:border-slate-700"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            className="w-full rounded bg-gray-900 px-4 py-2 text-white hover:bg-black disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-4 text-xs text-slate-500">
          <Link className="underline hover:no-underline" to="/">Retour</Link>
        </div>
      </div>
    </div>
  )
}
