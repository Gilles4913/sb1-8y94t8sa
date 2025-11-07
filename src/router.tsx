import { createBrowserRouter } from 'react-router-dom'

// Layouts
import AdminLayout from '@/components/layouts/AdminLayout'
import ClubLayout from '@/components/layouts/ClubLayout'

// Guards
import RequireSuperAdmin from '@/guards/RequireSuperAdmin'
import RequireActiveTenant from '@/guards/RequireActiveTenant'

// Pages Admin
import AdminDashboard from '@/pages/admin'         // /admin
import AdminClubsPage from '@/pages/admin/clubs'   // /admin/clubs
import ClubDetailPage from '@/pages/admin/clubs/[id]' // /admin/clubs/:id

// Pages Club
import ClubDashboard from '@/pages/clubs'          // /clubs
import ClubSponsorsPage from '@/pages/clubs/sponsors' // /clubs/sponsors

// Optionnel : 404
function NotFound() {
  return <div className="p-6">404 — Page introuvable</div>
}

export const router = createBrowserRouter([
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
  // racine (rediriger selon le rôle si tu veux)
  { path: '/', element: <AdminDashboard /> },
  { path: '*', element: <NotFound /> },
])
