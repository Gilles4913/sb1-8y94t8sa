import { useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL!, import.meta.env.VITE_SUPABASE_ANON_KEY!)

export default function LoginSafety() {
  useEffect(() => {
    try { localStorage.removeItem('activeTenantId'); localStorage.removeItem('activeTenantName') } catch {}
    supabase.auth.signOut().catch(() => {}) // soft, non bloquant
  }, [])
  return null
}
