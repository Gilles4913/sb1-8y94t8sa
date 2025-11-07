import { Link } from 'react-router-dom'

export default function AdminDashboard() {
  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Dashboard Super Admin</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Link className="rounded-md border p-4 hover:bg-gray-50" to="/admin/clubs">
          Gérer les clubs
        </Link>
        {/* Ajoute ici d'autres entrées utiles (statistiques globales, etc.) */}
      </div>
    </div>
  )
}
