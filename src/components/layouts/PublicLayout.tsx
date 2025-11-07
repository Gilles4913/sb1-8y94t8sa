import { Outlet, Link } from 'react-router-dom'

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="w-full border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
          <Link to="/" className="font-semibold">Sponsor Manager</Link>
          <nav className="flex items-center gap-2">
            <Link to="/login" className="rounded-md px-3 py-1.5 text-sm text-gray-800 hover:bg-gray-100">
              Connexion
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl p-4">
        <Outlet />
      </main>
    </div>
  )
}
