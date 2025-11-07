import { createBrowserRouter } from 'react-router-dom'

// Layouts
import PublicLayout from '@/components/layouts/PublicLayout'
import AdminLayout from '@/components/layouts/AdminLayout'
import ClubLayout from '@/components/layouts/ClubLayout'

// Guards
import RequireSuperAdmin from '@/guards/RequireSuperAdmin'
import RequireActiveTenant from '@/guards/RequireActiveTenant'

// Pages publiques
import PublicHome from '@/pages'
import LoginPage from '@/pages/login'

// Pages Admin
import AdminDashboard from '@/pages/admin'
import AdminClubsPage from '@/pages/admin/clubs'
import ClubDetailPage from '@/pages/admin/clubs/[id]'

// Pages Club
import ClubDashboard from '@/pages/clubs'
import ClubSponsorsPage from '@/pages/clubs/sponsors'

// 404 simple
function NotFound() {
  return <div className="p-6">404 — Page introuvable</div>
}

export const router = createBrowserRouter([
  // Public
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <PublicHome /> },
      { path: 'login', element: <LoginPage /> },
    ],
  },

  // Admin
  {
    path: '/admin',
    element: (
      <RequireSuperAdmin>
        <AdminLayout />
      </RequireSuperAdmin>
    ),
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'clubs', element: <AdminClubsPage /> },
      { path: 'clubs/:id', element: <ClubDetailPage /> },
    ],
  },

  // Club (tenant actif requis)
  {
    path: '/clubs',
    element: (
      <RequireActiveTenant>
        <ClubLayout />
      </RequireActiveTenant>
    ),
    children: [
      { index: true, element: <ClubDashboard /> },
      { path: 'sponsors', element: <ClubSponsorsPage /> },
    ],
  },

  { path: '*', element: <NotFound /> },
])
