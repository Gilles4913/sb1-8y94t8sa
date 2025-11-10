import { createContext, useContext, useEffect, useState } from 'react'
import supabase from '@/lib/supabase'

type Tenant = {
  id: string
  name: string
} | null

interface TenantContextValue {
  tenant: Tenant
  setTenant: (tenant: Tenant) => void
  clearTenant: () => void
}

const TenantContext = createContext<TenantContextValue>({
  tenant: null,
  setTenant: () => {},
  clearTenant: () => {},
})

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenantState] = useState<Tenant>(null)

  // 🔹 Charger le tenant actif depuis le localStorage
  useEffect(() => {
    const id = localStorage.getItem('activeTenantId')
    const name = localStorage.getItem('activeTenantName')
    if (id) setTenantState({ id, name: name || 'Club' })
  }, [])

  // 🔹 Sauvegarder ou supprimer dans le localStorage
  const setTenant = (t: Tenant) => {
    setTenantState(t)
    if (t) {
      localStorage.setItem('activeTenantId', t.id)
      localStorage.setItem('activeTenantName', t.name)
    } else {
      localStorage.removeItem('activeTenantId')
      localStorage.removeItem('activeTenantName')
    }
  }

  const clearTenant = () => setTenant(null)

  // 🔹 Nettoyer à la déconnexion
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) clearTenant()
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  return (
    <TenantContext.Provider value={{ tenant, setTenant, clearTenant }}>
      {children}
    </TenantContext.Provider>
  )
}

export const useTenant = () => useContext(TenantContext)
