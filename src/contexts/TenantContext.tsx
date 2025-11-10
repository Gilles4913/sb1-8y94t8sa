import { createContext, useContext, useEffect, useState } from 'react'
import supabase from '@/lib/supabase'

type Tenant = { id: string; name: string } | null

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
  const [tenant, setTenantState] = useState<Tenant>(() => {
    // Récupération initiale dès le montage
    const id = localStorage.getItem('activeTenantId')
    const name = localStorage.getItem('activeTenantName')
    return id ? { id, name: name || 'Club' } : null
  })

  // ---- SET TENANT ----
  const setTenant = (t: Tenant) => {
    if (t) {
      console.log('✅ setTenant:', t)
      localStorage.setItem('activeTenantId', t.id)
      localStorage.setItem('activeTenantName', t.name)
      setTenantState(t)
    } else {
      clearTenant()
    }
  }

  // ---- CLEAR TENANT ----
  const clearTenant = () => {
    console.log('🚫 clearTenant()')
    localStorage.removeItem('activeTenantId')
    localStorage.removeItem('activeTenantName')
    setTenantState(null)
  }

  // ---- RESTAURE AU DÉMARRAGE ----
  useEffect(() => {
    const id = localStorage.getItem('activeTenantId')
    const name = localStorage.getItem('activeTenantName')
    if (id) setTenantState({ id, name: name || 'Club' })
  }, [])

  // ---- SUPABASE AUTH EVENTS ----
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth event:', event, session?.user?.email)
      // ⚠️ Ne pas effacer le tenant sauf déconnexion réelle
      if (event === 'SIGNED_OUT' || !session) clearTenant()
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
