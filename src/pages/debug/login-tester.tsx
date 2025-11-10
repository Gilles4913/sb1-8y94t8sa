import { useEffect, useMemo, useState } from 'react'
import supabase from '@/lib/supabase'

type Out = Record<string, any>

function Section({ title, children }: { title: string; children: any }) {
  return (
    <div className="mb-4 rounded border p-3 text-xs dark:border-zinc-800">
      <div className="mb-2 font-semibold">{title}</div>
      <pre className="overflow-auto">{typeof children === 'string' ? children : JSON.stringify(children, null, 2)}</pre>
    </div>
  )
}

export default function LoginTester() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [out, setOut] = useState<Out>({})
  const [running, setRunning] = useState(false)

  const env = useMemo(() => ({
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY_present: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    // On ne log pas la clé entière côté UI
    ANON_prefix: import.meta.env.VITE_SUPABASE_ANON_KEY ? String(import.meta.env.VITE_SUPABASE_ANON_KEY).slice(0, 8) + '…' : null,
  }), [])

  useEffect(() => {
    (async () => {
      const o: Out = { env }
      o.localStorageKeys = Object.keys(localStorage).filter(k => k.startsWith('sb-') || k.startsWith('sb-sponsor-auth') || k === 'activeTenantId' || k === 'activeTenantName')
      const { data: sess0 } = await supabase.auth.getSession()
      o.session_before = sess0?.session ? {
        user_id: sess0.session.user.id,
        email: sess0.session.user.email,
        exp: sess0.session.expires_at
      } : null
      setOut(o)
    })()
  }, [env])

  const clearLocal = () => {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('sb-') || k === 'activeTenantId' || k === 'activeTenantName' || k === 'sb-sponsor-auth') {
        localStorage.removeItem(k)
      }
    })
    setOut(o => ({ ...o, note: 'LocalStorage nettoyé. Rechargez la page et réessayez.' }))
  }

  const testLogin = async () => {
    setRunning(true)
    const o: Out = { ...out, now: new Date().toISOString() }
    try {
      // 1) signOut pour repartir propre
      await supabase.auth.signOut().catch(() => {})
      o.after_signOut_keys = Object.keys(localStorage).filter(k => k.startsWith('sb-') || k === 'activeTenantId' || k === 'activeTenantName')

      // 2) Tentative de login
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      o.signIn_data = data
      o.signIn_error = error ? { message: error.message, name: error.name, status: (error as any).status, code: (error as any).code } : null

      // 3) Session juste après
      const { data: sessAfter } = await supabase.auth.getSession()
      o.session_after = sessAfter?.session ? {
        user_id: sessAfter.session.user.id,
        email: sessAfter.session.user.email,
        exp: sessAfter.session.expires_at
      } : null

      // 4) app_users / rôle
      if (sessAfter?.session?.user?.id) {
        const { data: row, error: rlsErr } = await supabase
          .from('app_users')
          .select('role, tenant_id')
          .eq('id', sessAfter.session.user.id)
          .maybeSingle()
        o.app_users_row = row || null
        o.app_users_error = rlsErr?.message || null
      }

      // 5) clés locales
      o.localStorage_after = Object.keys(localStorage).filter(k => k.startsWith('sb-') || k === 'activeTenantId' || k === 'activeTenantName')

    } catch (e: any) {
      o.throw = { message: e?.message || String(e), stack: e?.stack }
    } finally {
      setOut(o); setRunning(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-4 text-xs">
      <h1 className="mb-3 text-lg font-semibold">Login Tester</h1>
      <div className="mb-4 flex gap-2">
        <input
          className="w-72 rounded border px-2 py-1"
          placeholder="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          className="w-56 rounded border px-2 py-1"
          placeholder="password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button
          className="rounded bg-gray-900 px-3 py-1 text-white disabled:opacity-50"
          onClick={testLogin}
          disabled={running}
        >
          {running ? 'Testing…' : 'Test Login'}
        </button>
        <button className="rounded border px-3 py-1" onClick={clearLocal}>Purger localStorage</button>
      </div>

      <Section title="ENV">{out.env}</Section>
      <Section title="Session avant">{out.session_before}</Section>
      <Section title="SignIn data / error">
        { { signIn_data: out.signIn_data, signIn_error: out.signIn_error } }
      </Section>
      <Section title="Session après">{out.session_after}</Section>
      <Section title="app_users row / error">
        {{ app_users_row: out.app_users_row, app_users_error: out.app_users_error }}
      </Section>
      <Section title="Clés localStorage (avant/après)">
        {{ before: out.localStorageKeys, after_signOut: out.after_signOut_keys, after: out.localStorage_after }}
      </Section>
      {out.throw && <Section title="Exception">{out.throw}</Section>}
    </div>
  )
}
