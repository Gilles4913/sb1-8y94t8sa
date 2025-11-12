import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '@/lib/supabase'
import { useTenant } from '@/contexts/TenantContext'

type Club = {
  id: string
  name: string
  email_contact: string | null
  status: 'active' | 'inactive'
}

export default function AdminClubsPage() {
  const nav = useNavigate()
  const { setTenant } = useTenant()

  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  // Formulaire create/update
  const [editing, setEditing] = useState<Club | null>(null)
  const [form, setForm] = useState<Partial<Club>>({ name: '', email_contact: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true); setErr(null)
    const { data, error } = await supabase
      .from('tenants')
      .select('id, name, email_contact, status')
      .order('name', { ascending: true })
    if (error) setErr(error.message)
    setClubs(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const switchTo = (c: Club) => {
    setTenant({ id: c.id, name: c.name })
    nav('/clubs')
  }

  // Appel API manage.ts
  async function callManage(action: string, payload: any) {
    const token = (await supabase.auth.getSession()).data.session?.access_token
    const res = await fetch('/api/admin/tenants/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action, payload }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`)
    return json
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setErr(null)
    try {
      if (editing) {
        await callManage('update', { id: editing.id, ...form })
      } else {
        await callManage('create', { name: form.name, email_contact: form.email_contact })
      }
      setEditing(null)
      setForm({ name: '', email_contact: '' })
      await load()
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  const suspendClub = async (c: Club) => {
    if (!confirm(`Suspendre « ${c.name} » ?`)) return
    try {
      await callManage('suspend', { id: c.id })
      load()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const activateClub = async (c: Club) => {
    try {
      await callManage('activate', { id: c.id })
      load()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const deleteClub = async (c: Club) => {
    if (!confirm(`Supprimer définitivement « ${c.name} » et toutes ses données ?`)) return
    try {
      await callManage('delete', { id: c.id })
      load()
    } catch (e: any) {
      alert(e.message)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Clubs</h1>

      <form onSubmit={onSubmit} className="space-y-3 rounded border bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <input className="rounded border px-3 py-2" placeholder="Nom *" required
            value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <input className="rounded border px-3 py-2" placeholder="Email de contact"
            value={form.email_contact || ''} onChange={e => setForm(f => ({ ...f, email_contact: e.target.value }))} />
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded bg-gray-900 px-4 py-2 text-white hover:bg-black disabled:opacity-50" disabled={saving}>
            {editing ? 'Mettre à jour' : 'Créer le club'}
          </button>
          {editing && (
            <button type="button" className="rounded border px-3 py-2" onClick={() => { setEditing(null); setForm({ name: '' }) }}>
              Annuler
            </button>
          )}
        </div>
        {err && <div className="rounded border border-red-200 bg-red-50 p-2 text-red-700">{err}</div>}
      </form>

      {loading ? (
        <div>Chargement…</div>
      ) : (
        <div className="overflow-auto rounded border bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 text-left">Nom</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-center">Statut</th>
                <th className="px-3 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clubs.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">{c.name}</td>
                  <td className="px-3 py-2">{c.email_contact || '-'}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`rounded px-2 py-0.5 text-xs ${c.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {c.status === 'active' ? 'Actif' : 'Suspendu'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center space-x-2">
                    <button className="rounded border px-2 py-1 text-xs" onClick={() => { setEditing(c); setForm({ name: c.name, email_contact: c.email_contact || '' }) }}>
                      Éditer
                    </button>
                    <button className="rounded border px-2 py-1 text-xs" onClick={() => switchTo(c)}>
                      Basculer
                    </button>
                    {c.status === 'active' ? (
                      <button className="rounded bg-amber-600 px-2 py-1 text-xs text-white" onClick={() => suspendClub(c)}>
                        Suspendre
                      </button>
                    ) : (
                      <button className="rounded bg-emerald-600 px-2 py-1 text-xs text-white" onClick={() => activateClub(c)}>
                        Activer
                      </button>
                    )}
                    <button className="rounded bg-red-600 px-2 py-1 text-xs text-white" onClick={() => deleteClub(c)}>
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
              {clubs.length === 0 && (
                <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-500">Aucun club</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
