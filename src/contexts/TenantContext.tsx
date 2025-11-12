import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import supabase from '@/lib/supabase'

type Tenant = { id: string; name: string }
type Ctx = {
  tenant: Tenant | null
  setTenant: (t: Tenant) => void
  clearTenant: () => void
}

const TenantContext = createContext<Ctx>({
  tenant: null,
  setTenant: () => {},
  clearTenant: () => {},
})

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenantState] = useState<Tenant | null>(null)

  // 1) Au premier chargement, ne PAS créer de tenant par défaut.
  useEffect(() => {
    const id = localStorage.getItem('activeTenantId')
    const name = localStorage.getItem('activeTenantName')
    if (id && name) setTenantState({ id, name })
    else setTenantState(null)
  }, [])

  // 2) Si on se déconnecte → nettoyage forcé
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!session) {
        localStorage.removeItem('activeTenantId')
        localStorage.removeItem('activeTenantName')
        setTenantState(null)
      }
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const setTenant = (t: Tenant) => {
    localStorage.setItem('activeTenantId', t.id)
    localStorage.setItem('activeTenantName', t.name)
    setTenantState(t)
  }
  const clearTenant = () => {
    localStorage.removeItem('activeTenantId')
    localStorage.removeItem('activeTenantName')
    setTenantState(null)
  }

  const value = useMemo(() => ({ tenant, setTenant, clearTenant }), [tenant])
  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
}

export const useTenant = () => useContext(TenantContext)
