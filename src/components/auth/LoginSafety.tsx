import { useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
)

export default function LoginSafety() {
  useEffect(() => {
    try {
      localStorage.removeItem('activeTenantId')
      localStorage.removeItem('activeTenantName')
    } catch {}
    // Déconnexion “soft” en arrière-plan, sans bloquer l’UI
    supabase.auth.signOut().catch(() => {})
  }, [])

  return null
}
