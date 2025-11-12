import { useEffect, useState } from 'react'
import supabase from '@/lib/supabase'
import { useTenant } from '@/contexts/TenantContext'

type Sponsor = {
  id: string
  tenant_id: string
  company: string
  contact_name: string | null
  email: string | null
  phone: string | null
  segment: string | null
  notes: string | null
}

export default function ClubSponsorsPage() {
  const { tenant } = useTenant()
  const [items, setItems] = useState<Sponsor[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const [editing, setEditing] = useState<Sponsor | null>(null)
  const [form, setForm] = useState<Partial<Sponsor>>({ company: '', email: '', contact_name: '', phone: '', segment: '', notes: '' })

  const load = async () => {
    if (!tenant) return
    setLoading(true); setErr(null)
    const { data, error } = await supabase
      .from('sponsors')
      .select('id, tenant_id, company, contact_name, email, phone, segment, notes')
      .eq('tenant_id', tenant.id)
      .order('company', { ascending: true })
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
      company: form.company?.trim() || '',
      contact_name: form.contact_name || null,
      email: form.email || null,
      phone: form.phone || null,
      segment: form.segment || null,
      notes: form.notes || null,
    }
    if (editing) {
      const { error } = await supabase.from('sponsors').update(payload).eq('id', editing.id)
      if (error) return alert(error.message)
    } else {
      const { error } = await supabase.from('sponsors').insert(payload)
      if (error) return alert(error.message)
    }
    setEditing(null)
    setForm({ company: '', email: '', contact_name: '', phone: '', segment: '', notes: '' })
    load()
  }

  const onEdit = (row: Sponsor) => {
    setEditing(row)
    setForm({ ...row })
  }

  const onDelete = async (row: Sponsor) => {
    if (!confirm(`Supprimer le sponsor « ${row.company} » ?`)) return
    const { error } = await supabase.from('sponsors').delete().eq('id', row.id)
    if (error) return alert(error.message)
    load()
  }

  if (!tenant) return <div className="p-6 text-red-600">Aucun club actif.</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Sponsors</h1>

      <form onSubmit={onSave} className="grid grid-cols-1 gap-3 rounded border bg-white p-4 shadow-sm md:grid-cols-3">
        <input className="rounded border px-3 py-2" placeholder="Entreprise *" required
          value={form.company || ''} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
        <input className="rounded border px-3 py-2" placeholder="Contact"
          value={form.contact_name || ''} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} />
        <input className="rounded border px-3 py-2" placeholder="Email"
          value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        <input className="rounded border px-3 py-2" placeholder="Téléphone"
          value={form.phone || ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
        <input className="rounded border px-3 py-2" placeholder="Segment (or/argent/bronze/…)"
          value={form.segment || ''} onChange={e => setForm(f => ({ ...f, segment: e.target.value }))} />
        <input className="rounded border px-3 py-2 md:col-span-2" placeholder="Notes"
          value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />

        <div className="flex items-center gap-2">
          <button className="rounded bg-gray-900 px-4 py-2 text-white hover:bg-black" type="submit">
            {editing ? 'Mettre à jour' : 'Ajouter'}
          </button>
          {editing && (
            <button type="button" className="rounded border px-4 py-2" onClick={() => { setEditing(null); setForm({ company: '' }) }}>
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
                <th className="px-3 py-2 text-left">Entreprise</th>
                <th className="px-3 py-2 text-left">Contact</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Téléphone</th>
                <th className="px-3 py-2 text-left">Segment</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">{r.company}</td>
                  <td className="px-3 py-2">{r.contact_name}</td>
                  <td className="px-3 py-2">{r.email}</td>
                  <td className="px-3 py-2">{r.phone}</td>
                  <td className="px-3 py-2">{r.segment}</td>
                  <td className="px-3 py-2 text-center">
                    <button className="rounded border px-2 py-1 text-xs mr-2" onClick={() => onEdit(r)}>Éditer</button>
                    <button className="rounded bg-red-600 px-2 py-1 text-xs text-white" onClick={() => onDelete(r)}>Supprimer</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-500">Aucun sponsor</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
