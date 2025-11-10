import { createBrowserRouter } from 'react-router-dom'

// Layouts
import PublicLayout from '@/components/layouts/PublicLayout'
import AdminLayout from '@/components/layouts/AdminLayout'
import ClubLayout from '@/components/layouts/ClubLayout'

// Guards
import RequireSuperAdmin from '@/guards/RequireSuperAdmin'
import RequireActiveTenant from '@/guards/RequireActiveTenant'

// Pages publiques
import PublicHome from '@/pages'          // le fichier src/pages/index.tsx ci-dessus
import LoginPage from '@/pages/login'
import LogoutPage from '@/pages/logout'
import DebugAuthPage from '@/pages/debug/auth'

// Pages Admin
import AdminDashboard from '@/pages/admin'
import AdminClubsPage from '@/pages/admin/clubs'
import ClubDetailPage from '@/pages/admin/clubs/[id]'

// Pages Club
import ClubDashboard from '@/pages/clubs'
import ClubSponsorsPage from '@/pages/clubs/sponsors'
import ClubCampaignsPage from '@/pages/clubs/campaigns'
import ClubInvitationsPage from '@/pages/clubs/invitations'
import ClubEmailTemplatesPage from '@/pages/clubs/templates'

// 404 simple
function NotFound() {
  return <div className="p-6">404 — Page introuvable</div>
}



export const router = createBrowserRouter([
  // Zone publique
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <PublicHome /> }, // bouton “Se connecter”
      { path: 'login', element: <LoginPage /> },
      { path: 'logout', element: <LogoutPage /> },
      { path: 'debug/auth', element: <DebugAuthPage /> }, // ← TEMP
    ],
  },

  // Zone Super Admin (protégée)
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

  // Zone Club (tenant actif requis)
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
      { path: 'campaigns', element: <ClubCampaignsPage /> },
      { path: 'invitations', element: <ClubInvitationsPage /> },
      { path: 'templates', element: <ClubEmailTemplatesPage /> },
    ],
  },

  // Catch-all
  { path: '*', element: <NotFound /> },
])
