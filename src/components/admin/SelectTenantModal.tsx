import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '@/lib/supabase'
import { useTenant } from '@/contexts/TenantContext'

type TenantRow = { id: string; name: string; email_contact?: string | null }

export default function SelectTenantModal({
  onClose,
}: { onClose: () => void }) {
  const nav = useNavigate()
  const { setActiveTenant } = useTenant()
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<TenantRow[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      setLoading(true); setError(null)
      try {
        const { data, error } = await supabase
          .from('tenants')
          .select('id, name, email_contact')
          .order('name', { ascending: true })
        if (error) throw error
        setItems(data || [])
      } catch (e: any) {
        setError(e.message || 'Erreur chargement des clubs')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return items
    return items.filter(
      (t) =>
        t.name.toLowerCase().includes(needle) ||
        (t.email_contact || '').toLowerCase().includes(needle)
    )
  }, [q, items])

  const choose = async (t: TenantRow) => {
    setActiveTenant({ id: t.id, name: t.name })
    nav('/clubs', { replace: true })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-xl border bg-white p-4 shadow-xl dark:bg-zinc-950 dark:border-zinc-800">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Choisir un club</h2>
          <button
            onClick={onClose}
            className="rounded-md border px-2 py-1 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800"
          >
            Annuler
          </button>
        </div>

        <input
          className="mb-3 w-full rounded border px-3 py-2 text-sm dark:bg-zinc-900 dark:border-zinc-700 dark:text-gray-100"
          placeholder="Rechercher un club (nom ou email contact)…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        {loading && <div className="p-3 text-sm">Chargement…</div>}
        {error && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700 dark:bg-red-900/30 dark:border-red-900">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="max-h-[60vh] overflow-auto rounded border dark:border-zinc-800">
            {filtered.length === 0 ? (
              <div className="p-3 text-sm text-gray-500">Aucun club trouvé.</div>
            ) : (
              <ul className="divide-y dark:divide-zinc-800">
                {filtered.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-3 p-3 hover:bg-gray-50 dark:hover:bg-zinc-900/60"
                  >
                    <div>
                      <div className="font-medium">{t.name}</div>
                      {t.email_contact && (
                        <div className="text-xs text-gray-500">{t.email_contact}</div>
                      )}
                    </div>
                    <button
                      onClick={() => choose(t)}
                      className="rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-black dark:bg-white dark:text-black dark:hover:bg-gray-200"
                    >
                      Utiliser ce club
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
