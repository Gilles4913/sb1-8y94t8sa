// src/router.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom'
import React from 'react'

// Layouts
import PublicLayout from '@/components/layouts/PublicLayout'
import AdminLayout from '@/components/layouts/AdminLayout'
import ClubLayout from '@/components/layouts/ClubLayout'

// Guards
import RequireSuperAdmin from '@/guards/RequireSuperAdmin'
import RequireActiveTenant from '@/guards/RequireActiveTenant'

// Pages publiques
import PublicHome from '@/pages'                 // page d'accueil publique (facultatif)
import LoginPage from '@/pages/login'
import LogoutPage from '@/pages/logout'

// Pages Super Admin
import AdminDashboard from '@/pages/admin'
import AdminClubsPage from '@/pages/admin/clubs'
import ClubDetailPage from '@/pages/admin/clubs/[id]' // si tu ne l’utilises pas, tu peux le retirer

// Pages Club
import ClubDashboard from '@/pages/clubs'
import ClubSponsorsPage from '@/pages/clubs/sponsors'
import ClubCampaignsPage from '@/pages/clubs/campaigns'
import ClubInvitationsPage from '@/pages/clubs/invitations'
import ClubEmailTemplatesPage from '@/pages/clubs/templates'
import ClubAnalyticsPage from '@/pages/clubs/analytics'
import ClubSettingsPage from '@/pages/clubs/settings'

// ———————————————————————————————————————————
// Petites vues utilitaires
function NotFound() {
  return <div className="p-6">404 — Page introuvable</div>
}

// Redirection douce si quelqu’un tape /app : on renvoie vers /login
// (tu peux plus tard faire une redirection intelligente selon le rôle)
function AppRedirect() {
  return <Navigate to="/login" replace />
}

// ———————————————————————————————————————————
// Router principal
export const router = createBrowserRouter([
  // Espace Public
  {
    path: '/',
    element: <PublicLayout />,
    errorElement: <NotFound />,
    children: [
      { index: true, element: <PublicHome /> },       // page d’accueil publique
      { path: 'login', element: <LoginPage /> },      // connexion
      { path: 'logout', element: <LogoutPage /> },    // déconnexion
      { path: 'app', element: <AppRedirect /> },      // redirection simple
    ],
  },

  // Espace Super Admin (protégé)
  {
    path: '/admin',
    element: (
      <RequireSuperAdmin>
        <AdminLayout />
      </RequireSuperAdmin>
    ),
    errorElement: <NotFound />,
    children: [
      { index: true, element: <AdminDashboard /> },       // tableau de bord super_admin
      { path: 'clubs', element: <AdminClubsPage /> },     // gestion des clubs
      { path: 'clubs/:id', element: <ClubDetailPage /> }, // détail d’un club (optionnel)
    ],
  },

  // Espace Club (protégé par un tenant actif)
  {
    path: '/clubs',
    element: (
      <RequireActiveTenant>
        <ClubLayout />
      </RequireActiveTenant>
    ),
    errorElement: <NotFound />,
    children: [
      { index: true, element: <ClubDashboard /> },             // dashboard club
      { path: 'sponsors', element: <ClubSponsorsPage /> },     // CRUD sponsors
      { path: 'campaigns', element: <ClubCampaignsPage /> },   // CRUD campagnes
      { path: 'invitations', element: <ClubInvitationsPage /> }, // invitations
      { path: 'templates', element: <ClubEmailTemplatesPage /> }, // modèles e-mails
      { path: 'analytics', element: <ClubAnalyticsPage /> },   // graphiques + IA
      { path: 'settings', element: <ClubSettingsPage /> },     // réglages club
    ],
  },

  // 404 globale
  { path: '*', element: <NotFound /> },
])
