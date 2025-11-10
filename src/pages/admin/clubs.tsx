import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { ClubActions } from '@/components/admin/ClubActions'
import { useTenant } from '@/contexts/TenantContext'
import { useNavigate } from 'react-router-dom'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
)

type ClubRow = {
  id: string
  name: string
  email_contact: string | null
  status: 'active'|'inactive'
  phone: string | null
  address: string | null
  admin_email?: string | null
  created_at?: string
}

export default function AdminClubsPage() {
  const [rows, setRows] = useState<ClubRow[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string|null>(null)
  const [q, setQ] = useState('')

  // formulaire créer/modifier
  const [editing, setEditing] = useState<ClubRow | null>(null)
  const [form, setForm] = useState<Partial<ClubRow>>({ name: '', email_contact: '', phone: '', address: '', status: 'active' })

  const { setActiveTenant } = useTenant()
  const navigate = useNavigate()

  const load = async () => {
    setErr(null); setLoading(true)
    try {
      const { data: clubs, error } = await supabase
        .from('tenants')
        .select('id,name,email_contact,status,phone,address,created_at')
        .order('created_at', { ascending: false })
      if (error) throw error

      const ids = (clubs || []).map(c => c.id)
      let adminByTenant: Record<string,string|undefined> = {}
      if (ids.length) {
        const { data: admins, error: e2 } = await supabase
          .from('app_users')
          .select('email, tenant_id, role')
          .in('tenant_id', ids)
        if (e2) throw e2
        ;(admins || []).forEach((u: any) => {
          if (u.role === 'club_admin') adminByTenant[u.tenant_id] = u.email
        })
      }

      setRows((clubs || []).map((c: any) => ({ ...c, admin_email: adminByTenant[c.id] })))
    } catch (e:any) {
      setErr(e.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    if (!q.trim()) return rows
    const s = q.toLowerCase()
    return rows.filter(r =>
      `${r.name} ${r.email_contact ?? ''} ${r.admin_email ?? ''}`.toLowerCase().includes(s)
    )
  }, [rows, q])

  const resetForm = () => { setEditing(null); setForm({ name: '', email_contact: '', phone: '', address: '', status: 'active' }) }
  const startCreate = () => { resetForm() }
  const startEdit = (club: ClubRow) => { setEditing(club); setForm({ ...club }) }

  const save = async () => {
    setErr(null)
    // validations simples
    if (!form.name?.trim()) { setErr('Nom obligatoire'); return }
    try {
      if (editing) {
        const { error } = await supabase
          .from('tenants')
          .update({
            name: form.name,
            email_contact: form.email_contact ?? null,
            phone: form.phone ?? null,
            address: form.address ?? null,
            status: (form.status as any) ?? 'active'
          })
          .eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('tenants')
          .insert([{
            name: form.name,
            email_contact: form.email_contact ?? null,
            phone: form.phone ?? null,
            address: form.address ?? null,
            status: (form.status as any) ?? 'active'
          }])
        if (error) throw error
      }
      await load()
      resetForm()
    } catch (e:any) {
      setErr(e.message || String(e))
    }
  }

  return (
    <div className="p-6 text-gray-900 dark:text-gray-100">
      <h1 className="mb-4 text-2xl font-semibold">Clubs</h1>

      {/* Formulaire Créer / Modifier */}
      <div className="mb-6 rounded-lg border p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="mb-3 font-medium">{editing ? 'Modifier le club' : 'Créer un club'}</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input className="rounded border px-3 py-2 text-sm dark:bg-zinc-800 dark:border-zinc-700"
                 placeholder="Nom *" value={form.name || ''} onChange={e => setForm(f => ({...f, name: e.target.value}))}/>
          <input className="rounded border px-3 py-2 text-sm dark:bg-zinc-800 dark:border-zinc-700"
                 placeholder="Email contact" value={form.email_contact || ''} onChange={e => setForm(f => ({...f, email_contact: e.target.value}))}/>
          <input className="rounded border px-3 py-2 text-sm dark:bg-zinc-800 dark:border-zinc-700"
                 placeholder="Téléphone" value={form.phone || ''} onChange={e => setForm(f => ({...f, phone: e.target.value}))}/>
          <input className="rounded border px-3 py-2 text-sm dark:bg-zinc-800 dark:border-zinc-700"
                 placeholder="Adresse" value={form.address || ''} onChange={e => setForm(f => ({...f, address: e.target.value}))}/>
          <select className="rounded border px-3 py-2 text-sm dark:bg-zinc-800 dark:border-zinc-700"
                  value={form.status || 'active'} onChange={e => setForm(f => ({...f, status: e.target.value as any}))}>
            <option value="active">Actif</option>
            <option value="inactive">Suspendu</option>
          </select>
        </div>
        <div className="mt-3 flex gap-2">
          <button className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800" onClick={save}>
            {editing ? 'Enregistrer' : 'Créer'}
          </button>
          <button className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800" onClick={resetForm}>
            Annuler
          </button>
        </div>
      </div>

      {/* Barre d’outils liste */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          className="w-full max-w-md rounded-md border px-3 py-2 text-sm dark:bg-zinc-800 dark:border-zinc-700"
          placeholder="Rechercher un club ou un email…"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <button className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800" onClick={startCreate}>Nouveau</button>
        <button className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800" onClick={load}>Rafraîchir</button>
      </div>

      {err && <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:border-red-900">{err}</div>}

      {loading ? <p>Chargement…</p> : (
        <div className="overflow-auto rounded-lg border dark:border-zinc-700">
          <table className="w-full min-w-[980px] border-collapse">
            <thead className="bg-gray-50 dark:bg-zinc-800">
              <tr>
                <th className="p-3 text-left text-sm font-medium">Nom</th>
                <th className="p-3 text-left text-sm font-medium">Email contact</th>
                <th className="p-3 text-left text-sm font-medium">Admin</th>
                <th className="p-3 text-left text-sm font-medium">Statut</th>
                <th className="p-3 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-t dark:border-zinc-700">
                  <td className="p-3">{r.name}</td>
                  <td className="p-3">{r.email_contact || '—'}</td>
                  <td className="p-3">{r.admin_email || '—'}</td>
                  <td className="p-3">{r.status}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800"
                        onClick={() => { setActiveTenant({ id: r.id, name: r.name }); navigate('/clubs') }}
                      >
                        Voir l’environnement club
                      </button>
                      <button
                        className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800"
                        onClick={() => startEdit(r)}
                      >
                        Modifier
                      </button>
                      <ClubActions
                        tenantId={r.id}
                        adminEmail={r.admin_email || undefined}
                        status={r.status}
                        clubName={r.name}
                        onChanged={load}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr><td className="p-3" colSpan={5}>Aucun club</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
