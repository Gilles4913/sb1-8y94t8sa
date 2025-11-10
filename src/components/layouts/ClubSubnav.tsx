import { NavLink } from 'react-router-dom'

export default function ClubSubnav() {
  const item = (to: string, label: string) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `rounded-md px-3 py-1.5 text-sm
         ${isActive
            ? 'bg-gray-900 text-white dark:bg-white dark:text-black'
            : 'text-gray-800 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-zinc-800'}`
      }
    >
      {label}
    </NavLink>
  )

  return (
    <div className="w-full border-b bg-white dark:bg-zinc-900 dark:border-zinc-800">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2">
        {item('/clubs', 'Dashboard')}
        {item('/clubs/sponsors', 'Sponsors')}
        {item('/clubs/campaigns', 'Campagnes')}
        {item('/clubs/invitations', 'Invitations')}
        {item('/clubs/templates', 'Modèles e-mails')}
      </div>
    </div>
  )
}
