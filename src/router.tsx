// ...
import ClubEmailTemplatesPage from '@/pages/clubs/templates'
import ChooseClubPage from '@/pages/clubs/choose'   // ← AJOUT

// ...
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
    { path: 'choose', element: <ChooseClubPage /> }, // ← AJOUT
  ],
},
