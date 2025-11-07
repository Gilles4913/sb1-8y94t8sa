// src/components/admin/ImpersonationBar.tsx
import { useTenant } from '@/contexts/TenantContext'
import { useNavigate } from 'react-router-dom'

export default function ImpersonationBar() {
  const { activeTenant, isImpersonating, clearActiveTenant } = useTenant()
  const nav = useNavigate()

  if (!isImpersonating || !activeTenant) return null

  return (
    <div className="w-full bg-amber-100 border-b border-amber-200 text-amber-900 px-4 py-2 text-sm flex items-center justify-between">
      <div>
        <b>Mode super_admin</b> — Vous voyez l'environnement du club : <b>{activeTenant.name}</b>
      </div>
      <div className="flex items-center gap-2">
        <button
          className="rounded border px-2 py-1 text-xs"
          onClick={() => nav('/club')} // route dashboard club
        >
          Aller au dashboard club
        </button>
        <button
          className="rounded border px-2 py-1 text-xs"
          onClick={() => { clearActiveTenant(); nav('/admin') }}
        >
          Quitter le mode club
        </button>
      </div>
    </div>
  )
}
