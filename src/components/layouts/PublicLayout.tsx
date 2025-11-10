import { Outlet, Link } from 'react-router-dom'

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100 text-gray-900">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-6 py-3 flex justify-between items-center">
          <Link to="/" className="font-semibold text-lg text-blue-700">
            A2Display
          </Link>
          <Link
            to="/login"
            className="text-sm text-blue-600 hover:underline"
          >
            Connexion
          </Link>
        </div>
      </header>

      <main className="flex-1 flex justify-center items-center">
        <Outlet />
      </main>
    </div>
  )
}
