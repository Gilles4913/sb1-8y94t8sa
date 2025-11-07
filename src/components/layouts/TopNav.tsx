import { Link, NavLink } from 'react-router-dom'

export default function TopNav() {
  const item = (to: string, label: string) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `rounded-md px-3 py-1.5 text-sm ${isActive ? 'bg-gray-900 text-white' : 'text-gray-800 hover:bg-gray-100'}`
      }
    >
      {label}
    </NavLink>
  )

  return (
    <header className="w-full border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
        <Link to="/" className="font-semibold">Sponsor Manager</Link>
        <nav className="flex items-center gap-2">
          {item('/admin', 'Admin')}
          {item('/clubs', 'Club')}
          {item('/clubs/sponsors', 'Sponsors')}
        </nav>
      </div>
    </header>
  )
}
