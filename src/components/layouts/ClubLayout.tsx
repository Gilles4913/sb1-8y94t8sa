import { Outlet, NavLink } from 'react-router-dom'
import TopNav from '@/components/TopNav'
import { useTenant } from '@/contexts/TenantContext'

export default function ClubLayout() {
  const { tenant } = useTenant()

  if (!tenant) {
    return (
      <div className="p-6 text-red-600">
        Aucun club actif.  
        <br />
        Retournez sur la liste des clubs depuis le mode Super-Admin.
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      <TopNav />

      <div className="flex-1 flex flex-col">
        <div className="border-b bg-white shadow-sm">
          <div className="px-6 py-2 text-sm text-gray-500">
            Environnement du club : <b>{tenant.name}</b>
          </div>

          <nav className="flex gap-6 px-6 py-3 text-sm border-t">
            <NavLink
              to="/clubs"
              end
              className={({ isActive }) =>
                `hover:text-blue-600 ${isActive ? 'font-semibold text-blue-700' : ''}`
              }
            >
              Tableau de bord
            </NavLink>

            {/* ⚡️ Menu Club complet toujours affiché */}
            <NavLink
              to="/clubs/sponsors"
              className={({ isActive }) =>
                `hover:text-blue-600 ${isActive ? 'font-semibold text-blue-700' : ''}`
              }
            >
              Sponsors
            </NavLink>

            <NavLink
              to="/clubs/campaigns"
              className={({ isActive }) =>
                `hover:text-blue-600 ${isActive ? 'font-semibold text-blue-700' : ''}`
              }
            >
              Campagnes
            </NavLink>

            <NavLink
              to="/clubs/invitations"
              className={({ isActive }) =>
                `hover:text-blue-600 ${isActive ? 'font-semibold text-blue-700' : ''}`
              }
            >
              Invitations
            </NavLink>

            <NavLink
              to="/clubs/templates"
              className={({ isActive }) =>
                `hover:text-blue-600 ${isActive ? 'font-semibold text-blue-700' : ''}`
              }
            >
              Modèles e-mails
            </NavLink>
          </nav>
        </div>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
