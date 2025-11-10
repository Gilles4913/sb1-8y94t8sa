import { useEffect } from 'react'
import supabase from '@/lib/supabase'

export default function LoginSafety() {
  useEffect(() => {
    try {
      localStorage.removeItem('activeTenantId')
      localStorage.removeItem('activeTenantName')
    } catch {}
    // déconnexion “soft” en arrière-plan, sans bloquer l’UI
    supabase.auth.signOut().catch(() => {})
  }, [])

  return null
}
