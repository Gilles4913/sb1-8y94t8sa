import { useTenant } from '@/contexts/TenantContext'

export default function ClubDashboard() {
  const { activeTenant, loading } = useTenant()

  if (loading) return <div className="p-6">Chargement…</div>
  if (!activeTenant?.id) return <div className="p-6">Aucun club actif</div>

  return (
    <div className="p-6">
      <h1 className="mb-2 text-2xl font-semibold">Tableau de bord — {activeTenant.name}</h1>
      <p className="text-sm text-gray-600">Bienvenue dans l’espace club.</p>

      {/* Ajoute ici tes widgets (objectif, promesses, campagnes, etc.) */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-lg border p-4">
          <div className="text-sm text-gray-500">Objectif atteint</div>
          <div className="text-2xl font-bold">—</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-gray-500">Promesses reçues</div>
          <div className="text-2xl font-bold">—</div>
        </div>
      </div>
    </div>
  )
}
