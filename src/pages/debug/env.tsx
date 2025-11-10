import { useEffect, useState } from 'react'
import supabase from '@/lib/supabase'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
// on continue d’afficher url/key dans la page, mais on n’instancie plus ici

export default function DebugEnvPage() {
  const [out, setOut] = useState<any>(null)

  useEffect(() => {
    (async () => {
      const res: any = {
        vite_supabase_url_present: !!url,
        vite_supabase_key_present: !!key,
        vite_supabase_url: url,
        key_prefix: key ? key.slice(0, 8) + '…' : null,
      }
      try {
        const { data, error } = await supabase.from('tenants').select('id').limit(1)
        res.query_ok = !error
        res.query_error = error?.message || null
        res.sample = data
      } catch (e:any) {
        res.query_ok = false
        res.query_error = e.message || String(e)
      }
      setOut(res)
    })()
  }, [])

  return (
    <div className="p-4">
      <h1 className="mb-3 text-xl font-semibold">Debug Env</h1>
      <pre className="text-xs bg-gray-100 dark:bg-zinc-900 p-3 rounded">{JSON.stringify(out, null, 2)}</pre>
    </div>
  )
}
