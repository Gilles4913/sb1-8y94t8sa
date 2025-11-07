import { useTenant } from '@/contexts/TenantContext'
import { Navigate } from 'react-router-dom'

export default function RequireActiveTenant({ children }: { children: JSX.Element }) {
  const { activeTenant, loading } = useTenant()
  if (loading) return <div className="p-6">Chargement…</div>
  if (!activeTenant?.id) return <Navigate to="/admin/clubs" replace />
  return children
}
