import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL!, import.meta.env.VITE_SUPABASE_ANON_KEY!)

export default function DebugAuthPage() {
  const [info, setInfo] = useState<any>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const out: any = {}

        const { data: sess } = await supabase.auth.getSession()
        out.session = sess?.session ? {
          user_id: sess.session.user.id,
          email: sess.session.user.email,
          exp: sess.session.expires_at
        } : null

        const { data: me } = await supabase.auth.getUser()
        out.user = me?.user ? { id: me.user.id, email: me.user.email } : null

        if (me?.user?.id) {
          const { data: au, error: e1 } = await supabase
            .from('app_users')
            .select('role, tenant_id, tenants(name)')
            .eq('id', me.user.id)
            .maybeSingle()
          out.app_user = au || null
          out.app_user_error = e1?.message || null
        }

        setInfo(out)
      } catch (e: any) {
        setErr(e.message || String(e))
      }
    })()
  }, [])

  return (
    <div className="p-4">
      <h1 className="mb-3 text-xl font-semibold">Debug Auth</h1>
      {err && <pre className="mb-3 text-red-600">{err}</pre>}
      <pre className="text-xs bg-gray-100 dark:bg-zinc-900 p-3 rounded">{JSON.stringify(info, null, 2)}</pre>
    </div>
  )
}
