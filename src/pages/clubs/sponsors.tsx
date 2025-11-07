import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useTenant } from '@/contexts/TenantContext'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
)

type Sponsor = {
  id: string
  tenant_id: string
  company: string
  contact_name: string | null
  email: string | null
  phone: string | null
  notes: string | null
  status: 'active'|'inactive'
  segment: 'or'|'argent'|'bronze'|'autre'|null
  created_at: string
}

export default function ClubSponsorsPage() {
  const { activeTenant, loading } = useTenant()
  const tenantId = activeTenant?.id
  const [rows, setRows] = useState<Sponsor[]>([])
  const [q, setQ] = useState('')
  const [err, setErr] = useState<string|null>(null)
  const [busy, setBusy] = useState(false)

  // form state
  const [editing, setEditing] = useState<Sponsor | null>(null)
  const [form, setForm] = useState<Partial<Sponsor>>({})

  const filtered = useMemo(() => {
    if (!q.trim()) return rows
    const s = q.toLowerCase()
    return rows.filter(r =>
      `${r.company} ${r.contact_name ?? ''} ${r.email ?? ''} ${r.phone ?? ''}`.toLowerCase().includes(s)
    )
  }, [rows, q])

  const load = async () => {
    if (!tenantId) return
    setErr(null)
    setBusy(true)
    try {
      const { data, error } = await supabase
        .from('sponsors')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
      if (error) throw error
      setRows(data as Sponsor[])
    } catch (e:any) {
      setErr(e.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => { if (!loading && tenantId) load() }, [tenantId, loading])

  const resetForm = () => { setEditing(null); setForm({ company:'', email:'', contact_name:'', phone:'', segment:null, notes:'', status:'active' }) }

  const startCreate = () => { resetForm() }
  const startEdit = (s: Sponsor) => { setEditing(s); setForm({ ...s }) }

  const save = async () => {
    if (!tenantId) return
    setErr(null); setBusy(true)
    try {
      if (editing) {
        const { error } = await supabase
          .from('sponsors')
          .update({
            company: form.company,
            contact_name: form.contact_name ?? null,
            email: form.email ?? null,
            phone: form.phone ?? null,
            notes: form.notes ?? null,
            segment: (form.segment as any) ?? null,
            status: (form.status as any) ?? 'active'
          })
          .eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('sponsors')
          .insert([{
            tenant_id: tenantId,
            company: form.company,
            contact_name: form.contact_name ?? null,
            email: form.email ?? null,
            phone: form.phone ?? null,
            notes: form.notes ?? null,
            segment: (form.segment as any) ?? null,
            status: (form.status as any) ?? 'active'
          }])
        if (error) throw error
      }
      await load()
      resetForm()
    } catch (e:any) {
      setErr(e.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  const toggleStatus = async (s: Sponsor) => {
    setBusy(true); setErr(null)
    try {
      const next = s.status === 'active' ? 'inactive' : 'active'
      const { error } = await supabase
        .from('sponsors')
        .update({ status: next })
        .eq('id', s.id)
      if (error) throw error
      await load()
    } catch (e:any) {
      setErr(e.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  const remove = async (s: Sponsor) => {
    if (!confirm(`Supprimer définitivement le sponsor "${s.company}" ?`)) return
    setBusy(true); setErr(null)
    try {
      const { error } = await supabase
        .from('sponsors')
        .delete()
        .eq('id', s.id)
      if (error) throw error
      await load()
    } catch (e:any) {
      setErr(e.message || String(e))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="p-6">Chargement…</div>
  if (!tenantId) return <div className="p-6">Aucun club actif</div>

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Sponsors — {activeTenant?.name}</h1>
      {err && <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>}

      {/* Recherche + Nouveau */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          className="w-full max-w-md rounded-md border px-3 py-2 text-sm"
          placeholder="Rechercher sponsor…"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <button
          className="rounded-md border px-3 py-2 text-sm"
          onClick={startCreate}
        >
          Nouveau sponsor
        </button>
        <button className="rounded-md border px-3 py-2 text-sm" onClick={load} disabled={busy}>Rafraîchir</button>
      </div>

      {/* Formulaire create/edit */}
      {(editing || form.company) && (
        <div className="mb-6 rounded-lg border p-4">
          <h2 className="mb-3 font-medium">{editing ? 'Modifier le sponsor' : 'Créer un sponsor'}</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input className="rounded border px-3 py-2 text-sm" placeholder="Raison sociale *"
                   value={form.company || ''} onChange={e => setForm(f => ({...f, company: e.target.value}))}/>
            <input className="rounded border px-3 py-2 text-sm" placeholder="Contact"
                   value={form.contact_name || ''} onChange={e => setForm(f => ({...f, contact_name: e.target.value}))}/>
            <input className="rounded border px-3 py-2 text-sm" placeholder="Email"
                   value={form.email || ''} onChange={e => setForm(f => ({...f, email: e.target.value}))}/>
            <input className="rounded border px-3 py-2 text-sm" placeholder="Téléphone"
                   value={form.phone || ''} onChange={e => setForm(f => ({...f, phone: e.target.value}))}/>
            <select className="rounded border px-3 py-2 text-sm"
                    value={form.segment || ''} onChange={e => setForm(f => ({...f, segment: (e.target.value || null) as any}))}>
              <option value="">— Segment —</option>
              <option value="or">Or</option>
              <option value="argent">Argent</option>
              <option value="bronze">Bronze</option>
              <option value="autre">Autre</option>
            </select>
            <select className="rounded border px-3 py-2 text-sm"
                    value={form.status || 'active'} onChange={e => setForm(f => ({...f, status: e.target.value as any}))}>
              <option value="active">Actif</option>
              <option value="inactive">Suspendu</option>
            </select>
            <textarea className="md:col-span-2 rounded border px-3 py-2 text-sm" placeholder="Notes"
                      value={form.notes || ''} onChange={e => setForm(f => ({...f, notes: e.target.value}))}/>
          </div>
          <div className="mt-3 flex gap-2">
            <button className="rounded-md border px-3 py-2 text-sm" disabled={busy || !form.company} onClick={save}>
              {editing ? 'Enregistrer' : 'Créer'}
            </button>
            <button className="rounded-md border px-3 py-2 text-sm" onClick={resetForm}>Annuler</button>
          </div>
        </div>
      )}

      {/* Tableau */}
      <div className="overflow-auto rounded-lg border">
        <table className="w-full min-w-[900px] border-collapse">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left text-sm font-medium">Sponsor</th>
              <th className="p-3 text-left text-sm font-medium">Contact</th>
              <th className="p-3 text-left text-sm font-medium">Email</th>
              <th className="p-3 text-left text-sm font-medium">Téléphone</th>
              <th className="p-3 text-left text-sm font-medium">Segment</th>
              <th className="p-3 text-left text-sm font-medium">Statut</th>
              <th className="p-3 text-left text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id} className="border-t">
                <td className="p-3">{r.company}</td>
                <td className="p-3">{r.contact_name || '—'}</td>
                <td className="p-3">{r.email || '—'}</td>
                <td className="p-3">{r.phone || '—'}</td>
                <td className="p-3">{r.segment || '—'}</td>
                <td className="p-3">
                  <span className={`rounded px-2 py-1 text-xs ${r.status==='active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                    {r.status==='active' ? 'Actif' : 'Suspendu'}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50" onClick={() => startEdit(r)}>
                      Modifier
                    </button>
                    <button className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50" onClick={() => toggleStatus(r)}>
                      {r.status==='active' ? 'Suspendre' : 'Réactiver'}
                    </button>
                    <button className="rounded-md border px-3 py-1.5 text-sm text-red-700 hover:bg-red-50" onClick={() => remove(r)}>
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr><td className="p-3" colSpan={7}>Aucun sponsor</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
