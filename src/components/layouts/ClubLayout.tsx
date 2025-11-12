// src/components/layouts/ClubLayout.tsx
import { Outlet, NavLink } from 'react-router-dom'
import TopNav from '@/components/TopNav'
import { useTenant } from '@/contexts/TenantContext'
import ImpersonationBanner from '@/components/ImpersonationBanner'

function Tab({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end={to === '/clubs'}
      className={({ isActive }) =>
        [
          'px-3 py-2 text-sm rounded-md transition-colors',
          isActive
            ? 'font-semibold text-blue-800 bg-blue-100 dark:text-blue-200 dark:bg-blue-900/30'
            : 'text-gray-700 hover:text-blue-700 hover:bg-blue-50 dark:text-slate-200 dark:hover:text-blue-200 dark:hover:bg-slate-800/60',
        ].join(' ')
      }
    >
      {children}
    </NavLink>
  )
}

export default function ClubLayout() {
  const { tenant } = useTenant()

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <TopNav />
      <ImpersonationBanner />

      <div className="border-b bg-white dark:bg-slate-900 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-2 text-sm text-gray-500 dark:text-slate-400">
          {tenant ? <>Environnement du club : <b className="text-gray-800 dark:text-slate-100">{tenant.name}</b></> : 'Aucun club actif'}
        </div>
        <nav className="max-w-6xl mx-auto px-6 py-3 flex flex-wrap gap-2">
          <Tab to="/clubs">Tableau de bord</Tab>
          <Tab to="/clubs/sponsors">Sponsors</Tab>
          <Tab to="/clubs/campaigns">Campagnes</Tab>
          <Tab to="/clubs/invitations">Invitations</Tab>
          <Tab to="/clubs/templates">Modèles e-mails</Tab>
          <Tab to="/clubs/analytics">Analyse</Tab>
          <Tab to="/clubs/settings">Réglages</Tab>
        </nav>
      </div>

      <main className="flex-1">
        <div className="max-w-6xl mx-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
