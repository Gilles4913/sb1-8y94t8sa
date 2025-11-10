import { Link } from 'react-router-dom'
import HelpHint from '@/components/ui/HelpHint'

export default function AdminDashboard() {
  return (
    <div className="p-6 text-gray-900 dark:text-gray-100">
      <h1 className="mb-2 text-2xl font-semibold">Dashboard Super Admin</h1>

      <HelpHint title="Comprendre les onglets Admin / Club / Sponsors">
        <ul className="list-disc pl-5 space-y-1">
          <li><b>Admin</b> — espace Super_admin pour gérer les <b>clubs</b> : créer, modifier, suspendre/réactiver, supprimer, et <b>basculer</b> dans l’environnement d’un club.</li>
          <li><b>Club</b> — tableau de bord côté club (quand tu as “basculé” sur un club ou si tu es connecté en tant que club_admin). Tous les écrans “campagnes, sponsors, promesses” s’appuient sur le <b>tenant actif</b>.</li>
          <li><b>Sponsors</b> — page rapide de gestion des sponsors du club actif (recherche, créer, modifier, suspendre/réactiver, supprimer).</li>
        </ul>
        <p className="mt-2">Astuce : le bandeau jaune en haut indique quand tu es en <b>impersonation</b> (tu vois l’environnement d’un club en tant que super_admin).</p>
      </HelpHint>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Link className="rounded-md border p-4 hover:bg-gray-50 dark:hover:bg-zinc-800 dark:border-zinc-700" to="/admin/clubs">
          Gérer les clubs
        </Link>
      </div>
    </div>
  )
}
