import { Navigate } from 'react-router-dom'
import { useTenant } from '@/contexts/TenantContext'

export default function RequireActiveTenant({ children }: { children: JSX.Element }) {
  const { activeTenant, loading } = useTenant()
  if (loading) return <div className="p-6">Chargement…</div>
  if (!activeTenant) return <Navigate to="/login" replace />
  return children
}
