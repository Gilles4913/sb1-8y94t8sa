import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { createClient } from '@supabase/supabase-js'

/**
 * Supabase client (public) — nécessite VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
 */
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
)

/**
 * Un tenant actif représente l’environnement club courant.
 * - En impersonation (super_admin) : stocké dans localStorage (activeTenantId/Name)
 * - En mode club_admin : déduit via app_users.tenant_id
 */
type TenantInfo = { id: string; name: string } | null

type TenantCtx = {
  activeTenant: TenantInfo
  setActiveTenant: (t: TenantInfo) => void
  clearActiveTenant: () => void
  loading: boolean
  isImpersonating: boolean
}

const TenantContext = createContext<TenantCtx>({
  activeTenant: null,
  setActiveTenant: () => {},
  clearActiveTenant: () => {},
  loading: true,
  isImpersonating: false,
})

export const useTenant = () => useContext(TenantContext)

/**
 * Helpers
 */
async function fetchTenantFromProfile():
  Promise<{ tenant: TenantInfo; role?: 'super_admin' | 'club_admin' | null }> {
  const { data: me } = await supabase.auth.getUser()
  const uid = me.user?.id
  if (!uid) return { tenant: null, role: null }

  // On récupère tenant_id et le nom du club
  const { data, error } = await supabase
    .from('app_users')
    .select('tenant_id, role, tenants(name)')
    .eq('id', uid)
    .single()

  if (error || !data) return { tenant: null, role: null }

  const tId = (data as any).tenant_id as string | null
  const tName = (data as any).tenants?.name as string | undefined
  return {
    tenant: tId ? { id: tId, name: tName || 'Club' } : null,
    role: (data as any).role ?? null,
  }
}

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [activeTenant, setActiveTenantState] = useState<TenantInfo>(null)
  const [loading, setLoading] = useState(true)
  const [isImpersonating, setIsImpersonating] = useState(false)

  /**
   * Initialisation :
   * 1) Si localStorage contient activeTenantId => impersonation (super_admin)
   * 2) Sinon, si l’utilisateur est club_admin avec tenant_id => tenant calculé depuis app_users
   */
  useEffect(() => {
    const init = async () => {
      try {
        const tid = localStorage.getItem('activeTenantId')
        const tname = localStorage.getItem('activeTenantName')
        if (tid) {
          setActiveTenantState({ id: tid, name: tname || 'Club' })
          setIsImpersonating(true)
          return
        }
        const { tenant } = await fetchTenantFromProfile()
        if (tenant) {
          setActiveTenantState(tenant)
          setIsImpersonating(false)
        }
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  /**
   * Écoute les changements d’auth :
   * - Déconnexion => on nettoie l’état tenant + impersonation
   * - Connexion/changement d’utilisateur => on recalcule tenant depuis app_users
   */
  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!session) {
          // Logout
          setActiveTenant(null)
          return
        }
        // Login ou token refresh : si pas d’impersonation explicite, recalcule depuis profil
        const hasImpersonation =
          !!localStorage.getItem('activeTenantId') ||
          !!localStorage.getItem('activeTenantName')

        if (!hasImpersonation) {
          const { tenant } = await fetchTenantFromProfile()
          setActiveTenantState(tenant)
          setIsImpersonating(false)
        }
      }
    )
    return () => {
      subscription.subscription?.unsubscribe?.()
    }
  }, [])

  /**
   * setActiveTenant :
   * - si t défini => on passe en impersonation (stockage local)
   * - si null => on sort de l’impersonation et on tente de reprendre le tenant “natif”
   */
  const setActiveTenant = (t: TenantInfo) => {
    setActiveTenantState(t)
    if (t) {
      localStorage.setItem('activeTenantId', t.id)
      localStorage.setItem('activeTenantName', t.name || '')
      setIsImpersonating(true)
    } else {
      localStorage.removeItem('activeTenantId')
      localStorage.removeItem('activeTenantName')
      setIsImpersonating(false)
    }
  }

  /**
   * clearActiveTenant :
   * - sort explicitement de l’impersonation
   * - recharge le tenant “natif” (club_admin) si existant
   */
  const clearActiveTenant = async () => {
    localStorage.removeItem('activeTenantId')
    localStorage.removeItem('activeTenantName')
    setIsImpersonating(false)
    // Reprendre le tenant du profil (si club_admin)
    const { tenant } = await fetchTenantFromProfile()
    setActiveTenantState(tenant)
  }

  const value = useMemo(
    () => ({
      activeTenant,
      setActiveTenant,
      clearActiveTenant,
      loading,
      isImpersonating,
    }),
    [activeTenant, loading, isImpersonating]
  )

  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  )
}
