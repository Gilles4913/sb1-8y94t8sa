import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL!, import.meta.env.VITE_SUPABASE_ANON_KEY!)

type TenantInfo = { id: string; name: string } | null
type TenantCtx = {
  activeTenant: TenantInfo
  setActiveTenant: (t: TenantInfo) => void
  clearActiveTenant: () => void
  loading: boolean
  isImpersonating: boolean
}
const TenantContext = createContext<TenantCtx>({
  activeTenant: null, setActiveTenant: () => {}, clearActiveTenant: () => {},
  loading: false, isImpersonating: false,
})
export const useTenant = () => useContext(TenantContext)

async function getProfileTenant(): Promise<TenantInfo> {
  const { data } = await supabase.auth.getUser()
  const uid = data.user?.id
  if (!uid) return null
  const { data: row } = await supabase
    .from('app_users')
    .select('tenant_id, tenants(name)')
    .eq('id', uid)
    .single()
  const tId = (row as any)?.tenant_id as string | undefined
  const tName = (row as any)?.tenants?.name as string | undefined
  return tId ? { id: tId, name: tName || 'Club' } : null
}

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [activeTenant, setActiveTenantState] = useState<TenantInfo>(null)
  const [loading, setLoading] = useState(false)
  const [isImpersonating, setIsImpersonating] = useState(false)

  useEffect(() => {
    const tid = localStorage.getItem('activeTenantId')
    const tname = localStorage.getItem('activeTenantName')
    if (tid) {
      setActiveTenantState({ id: tid, name: tname || 'Club' })
      setIsImpersonating(true)
    }
  }, [])

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, session) => {
      if (!session) {
        setIsImpersonating(false)
        setActiveTenantState(null)
        return
      }
      const hasImpersonation = !!localStorage.getItem('activeTenantId') || !!localStorage.getItem('activeTenantName')
      if (!hasImpersonation) {
        setLoading(true)
        try { setActiveTenantState(await getProfileTenant()); setIsImpersonating(false) }
        finally { setLoading(false) }
      }
    })
    return () => { sub.subscription?.unsubscribe?.() }
  }, [])

  const setActiveTenant = (t: TenantInfo) => {
    setActiveTenantState(t)
    if (t) { localStorage.setItem('activeTenantId', t.id); localStorage.setItem('activeTenantName', t.name || ''); setIsImpersonating(true) }
    else { localStorage.removeItem('activeTenantId'); localStorage.removeItem('activeTenantName'); setIsImpersonating(false) }
  }

  const clearActiveTenant = async () => {
    localStorage.removeItem('activeTenantId'); localStorage.removeItem('activeTenantName'); setIsImpersonating(false)
    const { data } = await supabase.auth.getUser()
    if (data.user) { setLoading(true); try { setActiveTenantState(await getProfileTenant()) } finally { setLoading(false) } }
    else { setActiveTenantState(null) }
  }

  const value = useMemo(() => ({ activeTenant, setActiveTenant, clearActiveTenant, loading, isImpersonating }),
    [activeTenant, loading, isImpersonating])

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
}
