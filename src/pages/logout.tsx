import { useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL!, import.meta.env.VITE_SUPABASE_ANON_KEY!)

export default function LogoutPage() {
  useEffect(() => {
    (async () => {
      try { await supabase.auth.signOut() } catch {}
      try {
        const keys = Object.keys(localStorage)
        for (const k of keys) {
          if (k.startsWith('sb-') || k === 'activeTenantId' || k === 'activeTenantName') localStorage.removeItem(k)
        }
      } catch {}
      window.location.replace('/login')
    })()
  }, [])
  return <div className="p-6">Déconnexion…</div>
}
