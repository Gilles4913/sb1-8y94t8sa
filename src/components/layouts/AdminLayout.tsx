import { Outlet, NavLink } from 'react-router-dom'
import TopNav from '@/components/TopNav'

export default function AdminLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      <TopNav />

      <div className="flex-1 flex flex-col">
        <div className="border-b bg-white shadow-sm">
          <nav className="flex gap-6 px-6 py-3 text-sm">
            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                `hover:text-blue-600 ${isActive ? 'font-semibold text-blue-700' : ''}`
              }
            >
              Tableau de bord
            </NavLink>

            <NavLink
              to="/admin/clubs"
              className={({ isActive }) =>
                `hover:text-blue-600 ${isActive ? 'font-semibold text-blue-700' : ''}`
              }
            >
              Clubs
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
