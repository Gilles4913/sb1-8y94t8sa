// ...
import ClubCampaignsPage from '@/pages/clubs/campaigns'
import ClubInvitationsPage from '@/pages/clubs/invitations'
import ClubEmailTemplatesPage from '@/pages/clubs/templates'
// ...

export const router = createBrowserRouter([
  // ... Public + Admin inchangés
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
  // ...
])
