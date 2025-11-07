// src/contexts/TenantContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
)

type TenantInfo = { id: string; name: string } | null

type Ctx = {
  activeTenant: TenantInfo
  setActiveTenant: (t: TenantInfo) => void
  clearActiveTenant: () => void
  loading: boolean
  isImpersonating: boolean // super_admin qui a forcé un club
}

const TenantContext = createContext<Ctx>({
  activeTenant: null,
  setActiveTenant: () => {},
  clearActiveTenant: () => {},
  loading: true,
  isImpersonating: false
})

export const useTenant = () => useContext(TenantContext)

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [activeTenant, setActiveTenantState] = useState<TenantInfo>(null)
  const [loading, setLoading] = useState(true)
  const [isImpersonating, setIsImpersonating] = useState(false)

  useEffect(() => {
    // Recharger depuis localStorage (impersonation super_admin)
    const raw = localStorage.getItem('activeTenantId')
    const rawName = localStorage.getItem('activeTenantName')
    if (raw) {
      setActiveTenantState({ id: raw, name: rawName || 'Club' })
      setIsImpersonating(true)
      setLoading(false)
      return
    }
    // Sinon, charger le tenant naturel de l’utilisateur (club_admin)
    ;(async () => {
      try {
        const { data: me } = await supabase.auth.getUser()
        const uid = me.user?.id
        if (!uid) { setLoading(false); return }
        const { data, error } = await supabase
          .from('app_users')
          .select('tenant_id, tenants(name)')
          .eq('id', uid)
          .single()
        if (!error && data?.tenant_id) {
          setActiveTenantState({ id: data.tenant_id, name: (data as any).tenants?.name || 'Club' })
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [])

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

  const clearActiveTenant = () => setActiveTenant(null)

  const value = useMemo(() => ({
    activeTenant, setActiveTenant, clearActiveTenant, loading, isImpersonating
  }), [activeTenant, loading, isImpersonating])

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  )
}
