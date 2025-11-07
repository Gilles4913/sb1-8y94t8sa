import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
)

async function getUserRole(): Promise<'super_admin'|'club_admin'|null> {
  const { data: me } = await supabase.auth.getUser()
  const uid = me.user?.id
  if (!uid) return null
  const { data, error } = await supabase
    .from('app_users')
    .select('role')
    .eq('id', uid)
    .single()
  if (error) return null
  return (data?.role as any) ?? null
}

export default function LoginPage() {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      // role-based redirect
      const role = await getUserRole()

      // Nettoie l’impersonation si existante
      localStorage.removeItem('activeTenantId')
      localStorage.removeItem('activeTenantName')

      if (role === 'super_admin') {
        nav('/admin', { replace: true })
      } else {
        nav('/clubs', { replace: true })
      }
    } catch (e: any) {
      setMsg(e.message || 'Échec de la connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto mt-10 w-full max-w-md rounded-lg border bg-white p-6">
      <h1 className="mb-4 text-xl font-semibold">Connexion</h1>
      {msg && <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">{msg}</div>}
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input
          className="rounded border px-3 py-2 text-sm"
          type="email"
          placeholder="Email"
          autoComplete="username"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          className="rounded border px-3 py-2 text-sm"
          type="password"
          placeholder="Mot de passe"
          autoComplete="current-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button
          className="rounded-md bg-gray-900 px-3 py-2 text-sm text-white hover:bg-black disabled:opacity-50"
          type="submit"
          disabled={loading}
        >
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </div>
  )
}
