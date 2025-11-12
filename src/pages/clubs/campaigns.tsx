import { useEffect, useState } from 'react'
import supabase from '@/lib/supabase'
import { useTenant } from '@/contexts/TenantContext'

type Campaign = {
  id: string
  tenant_id: string
  title: string
  screen_type: string | null
  annual_price_hint: number | null
  objective_amount: number | null
}

export default function ClubCampaignsPage() {
  const { tenant } = useTenant()
  const [items, setItems] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const [editing, setEditing] = useState<Campaign | null>(null)
  const [form, setForm] = useState<Partial<Campaign>>({ title: '', screen_type: 'ecran_interieur', annual_price_hint: null, objective_amount: null })

  const load = async () => {
    if (!tenant) return
    setLoading(true); setErr(null)
    const { data, error } = await supabase
      .from('campaigns')
      .select('id, tenant_id, title, screen_type, annual_price_hint, objective_amount')
      .eq('tenant_id', tenant.id)
      .order('title', { ascending: true })
    if (error) setErr(error.message)
    setItems(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [tenant])

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenant) return
    const payload = {
      tenant_id: tenant.id,
      title: form.title?.trim() || '',
      screen_type: form.screen_type || null,
      annual_price_hint: form.annual_price_hint ?? null,
      objective_amount: form.objective_amount ?? null,
    }
    if (editing) {
      const { error } = await supabase.from('campaigns').update(payload).eq('id', editing.id)
      if (error) return alert(error.message)
    } else {
      const { error } = await supabase.from('campaigns').insert(payload)
      if (error) return alert(error.message)
    }
    setEditing(null)
    setForm({ title: '', screen_type: 'ecran_interieur', annual_price_hint: null, objective_amount: null })
    load()
  }

  const onEdit = (row: Campaign) => {
    setEditing(row)
    setForm({ ...row })
  }

  const onDelete = async (row: Campaign) => {
    if (!confirm(`Supprimer la campagne « ${row.title} » ?`)) return
    const { error } = await supabase.from('campaigns').delete().eq('id', row.id)
    if (error) return alert(error.message)
    load()
  }

  if (!tenant) return <div className="p-6 text-red-600">Aucun club actif.</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Campagnes</h1>

      <form onSubmit={onSave} className="grid grid-cols-1 gap-3 rounded border bg-white p-4 shadow-sm md:grid-cols-4">
        <input className="rounded border px-3 py-2 md:col-span-2" placeholder="Titre *" required
          value={form.title || ''} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        <select className="rounded border px-3 py-2"
          value={form.screen_type || 'ecran_interieur'}
          onChange={e => setForm(f => ({ ...f, screen_type: e.target.value }))}>
          <option value="panneau_led">Panneau LED</option>
          <option value="borne_exterieur">Borne extérieur</option>
          <option value="borne_interieur">Borne intérieur</option>
          <option value="ecran_interieur">Écran intérieur</option>
        </select>
        <input className="rounded border px-3 py-2" type="number" step="1" placeholder="Prix indicatif annuel (€)"
          value={form.annual_price_hint ?? ''} onChange={e => setForm(f => ({ ...f, annual_price_hint: e.target.value ? Number(e.target.value) : null }))} />
        <input className="rounded border px-3 py-2" type="number" step="1" placeholder="Objectif (€)"
          value={form.objective_amount ?? ''} onChange={e => setForm(f => ({ ...f, objective_amount: e.target.value ? Number(e.target.value) : null }))} />

        <div className="flex items-center gap-2 md:col-span-4">
          <button className="rounded bg-gray-900 px-4 py-2 text-white hover:bg-black" type="submit">
            {editing ? 'Mettre à jour' : 'Ajouter'}
          </button>
          {editing && (
            <button type="button" className="rounded border px-4 py-2" onClick={() => { setEditing(null); setForm({ title: '' }) }}>
              Annuler
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <div>Chargement…</div>
      ) : err ? (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{err}</div>
      ) : (
        <div className="overflow-auto rounded border bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left">Titre</th>
                <th className="px-3 py-2 text-left">Type d’écran</th>
                <th className="px-3 py-2 text-right">Prix indicatif</th>
                <th className="px-3 py-2 text-right">Objectif</th>
                <th className="px-3 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">{r.title}</td>
                  <td className="px-3 py-2">{r.screen_type}</td>
                  <td className="px-3 py-2 text-right">{r.annual_price_hint?.toLocaleString('fr-FR') || '-'}</td>
                  <td className="px-3 py-2 text-right">{r.objective_amount?.toLocaleString('fr-FR') || '-'}</td>
                  <td className="px-3 py-2 text-center">
                    <button className="rounded border px-2 py-1 text-xs mr-2" onClick={() => onEdit(r)}>Éditer</button>
                    <button className="rounded bg-red-600 px-2 py-1 text-xs text-white" onClick={() => onDelete(r)}>Supprimer</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-6 text-center text-gray-500">Aucune campagne</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
