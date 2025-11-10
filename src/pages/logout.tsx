import { useEffect } from 'react'
import supabase from '@/lib/supabase'

export default function LogoutPage() {
  useEffect(() => {
    (async () => {
      try { await supabase.auth.signOut() } catch {}
      try {
        const keys = Object.keys(localStorage)
        for (const k of keys) {
          if (k.startsWith('sb-') || k === 'activeTenantId' || k === 'activeTenantName' || k === 'sb-sponsor-auth') {
            localStorage.removeItem(k)
          }
        }
      } catch {}
      window.location.replace('/login')
    })()
  }, [])
  return <div className="p-6">Déconnexion…</div>
}
