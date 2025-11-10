import { Navigate, Outlet } from 'react-router-dom'
import { useTenant } from '@/contexts/TenantContext'

export default function RequireActiveTenant() {
  const { tenant } = useTenant()
  if (!tenant) return <Navigate to="/admin" replace />
  return <Outlet />
}
