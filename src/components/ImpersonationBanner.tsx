// src/components/ImpersonationBanner.tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTenant } from '@/contexts/TenantContext'
import supabase from '@/lib/supabase'

export default function ImpersonationBanner() {
  const { tenant, clearTenant } = useTenant()
  const [isSuper, setIsSuper] = useState(false)
  const nav = useNavigate()

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser()
      const uid = data.user?.id
      if (!uid) return setIsSuper(false)
      const { data: row } = await supabase
        .from('app_users')
        .select('role')
        .eq('id', uid)
        .single()
      setIsSuper(row?.role === 'super_admin')
    })()
  }, [])

  if (!tenant || !isSuper) return null

  return (
    <div className="border-b bg-amber-50 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100 dark:border-amber-800">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-2 text-sm">
        <div>
          <span className="font-semibold">Mode super_admin —</span>{' '}
          Vous voyez l’environnement du club : <b>{tenant.name}</b>
        </div>
        <button
          onClick={() => { clearTenant(); nav('/admin') }}
          className="rounded bg-amber-600 px-3 py-1 text-white hover:bg-amber-700"
        >
          Quitter le mode club
        </button>
      </div>
    </div>
  )
}
