import { createBrowserRouter } from 'react-router-dom'

import PublicLayout from '@/components/layouts/PublicLayout'
import AdminLayout from '@/components/layouts/AdminLayout'
import ClubLayout from '@/components/layouts/ClubLayout'

import RequireSuperAdmin from '@/guards/RequireSuperAdmin'
import RequireActiveTenant from '@/guards/RequireActiveTenant'

import PublicHome from '@/pages'
import LoginPage from '@/pages/login'
import LogoutPage from '@/pages/logout'

import AdminDashboard from '@/pages/admin'
import AdminClubsPage from '@/pages/admin/clubs'

import ClubDashboard from '@/pages/clubs'
import ClubSponsorsPage from '@/pages/clubs/sponsors'
import ClubCampaignsPage from '@/pages/clubs/campaigns'
import ClubInvitationsPage from '@/pages/clubs/invitations'
import ClubEmailTemplatesPage from '@/pages/clubs/templates'
import ClubSettingsPage from '@/pages/clubs/settings'
import ClubAnalyticsPage from '@/pages/clubs/analytics'

function NotFound() {
  return <div className="p-6 text-red-600">404 — Page introuvable</div>
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <PublicHome /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'logout', element: <LogoutPage /> },
    ],
  },
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
      { path: 'campaigns', element: <ClubCampaignsPage /> },
      { path: 'invitations', element: <ClubInvitationsPage /> },
      { path: 'templates', element: <ClubEmailTemplatesPage /> },
      { path: 'settings', element: <ClubSettingsPage /> },   // 👈
      { path: 'analytics', element: <ClubAnalyticsPage /> },
    ],
  },
  { path: '*', element: <NotFound /> },
])
