import { Outlet, NavLink } from 'react-router-dom'
import TopNav from '@/components/TopNav'
import { useTenant } from '@/contexts/TenantContext'

function TabLink({
  to,
  children,
}: {
  to: string
  children: React.ReactNode
}) {
  return (
    <NavLink
      to={to}
      end={to === '/clubs'}
      className={({ isActive }) =>
        [
          'px-3 py-2 text-sm rounded-md transition-colors',
          'hover:text-blue-700 hover:bg-blue-50',
          isActive ? 'font-semibold text-blue-800 bg-blue-100' : 'text-gray-700',
        ].join(' ')
      }
    >
      {children}
    </NavLink>
  )
}

export default function ClubLayout() {
  const { tenant } = useTenant()

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <TopNav />
        <main className="max-w-5xl mx-auto p-6">
          <div className="rounded border border-amber-200 bg-amber-50 p-4">
            <div className="font-semibold text-amber-800 mb-1">Aucun club actif</div>
            <p className="text-sm text-amber-700">
              Retournez sur la liste des clubs depuis l’espace Super-Admin pour sélectionner un club.
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      <TopNav />

      <div className="flex-1 flex flex-col">
        {/* Bandeau contexte club */}
        <div className="border-b bg-white">
          <div className="max-w-6xl mx-auto px-6 py-2 text-sm text-gray-500">
            Environnement du club : <b className="text-gray-800">{tenant.name}</b>
          </div>

          {/* Onglets Club */}
          <nav className="max-w-6xl mx-auto px-6 py-3 flex flex-wrap gap-2">
            <TabLink to="/clubs">Tableau de bord</TabLink>
            <TabLink to="/clubs/sponsors">Sponsors</TabLink>
            <TabLink to="/clubs/campaigns">Campagnes</TabLink>
            <TabLink to="/clubs/invitations">Invitations</TabLink>
            <TabLink to="/clubs/templates">Modèles e-mails</TabLink>
            <TabLink to="/clubs/analytics">Analyse</TabLink>
            <TabLink to="/clubs/settings">Réglages</TabLink>
          </nav>
        </div>

        {/* Contenu */}
        <main className="flex-1">
          <div className="max-w-6xl mx-auto p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
