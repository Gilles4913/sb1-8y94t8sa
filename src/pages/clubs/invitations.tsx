import { useEffect, useMemo, useState } from 'react'
import supabase from '@/lib/supabase'
import { useTenant } from '@/contexts/TenantContext'

type Option = { id: string; label: string }
type Invitation = {
  id: string
  email: string | null
  status: string | null
  campaign_id: string
  sponsor_id: string | null
}

export default function ClubInvitationsPage() {
  const { tenant } = useTenant()
  const [campaigns, setCampaigns] = useState<Option[]>([])
  const [sponsors, setSponsors] = useState<Option[]>([])
  const [items, setItems] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const [form, setForm] = useState<{ campaign_id?: string; sponsor_id?: string; email?: string }>({})

  const canSubmit = useMemo(() => !!form.campaign_id && (!!form.sponsor_id || !!form.email), [form])

  const load = async () => {
    if (!tenant) return
    setLoading(true); setErr(null)
    try {
      const [{ data: cs }, { data: ss }, { data: invs }] = await Promise.all([
        supabase.from('campaigns').select('id, title').eq('tenant_id', tenant.id).order('title'),
        supabase.from('sponsors').select('id, company, email').eq('tenant_id', tenant.id).order('company'),
        supabase.from('invitations').select('id, email, status, campaign_id, sponsor_id').in(
          'campaign_id',
          (await supabase.from('campaigns').select('id').eq('tenant_id', tenant.id)).data?.map(r => r.id) || []
        ).order('id', { ascending: false }),
      ])
      setCampaigns((cs || []).map((r: any) => ({ id: r.id, label: r.title })))
      setSponsors((ss || []).map((r: any) => ({ id: r.id, label: r.company + (r.email ? ` <${r.email}>` : '') })))
      setItems(invs || [])
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [tenant])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenant || !form.campaign_id) return
    const sponsorEmail = sponsors.find(s => s.id === form.sponsor_id)?.label.match(/<(.+)>/)?.[1] || null
    const payload = {
      campaign_id: form.campaign_id!,
      sponsor_id: form.sponsor_id || null,
      email: form.email || sponsorEmail,
      status: 'sent' as const,
    }
    const { error } = await supabase.from('invitations').insert(payload)
    if (error) return alert(error.message)
    setForm({})
    load()
  }

  if (!tenant) return <div className="p-6 text-red-600">Aucun club actif.</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Invitations aux sponsors</h1>

      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 rounded border bg-white p-4 shadow-sm md:grid-cols-4">
        <select className="rounded border px-3 py-2 md:col-span-2" value={form.campaign_id || ''} onChange={e => setForm(f => ({ ...f, campaign_id: e.target.value || undefined }))}>
          <option value="">— Choisir une campagne —</option>
          {campaigns.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>

        <select className="rounded border px-3 py-2" value={form.sponsor_id || ''} onChange={e => setForm(f => ({ ...f, sponsor_id: e.target.value || undefined }))}>
          <option value="">— Choisir un sponsor —</option>
          {sponsors.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>

        <input className="rounded border px-3 py-2" placeholder="ou email direct"
          value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value || undefined }))} />

        <div className="md:col-span-4">
          <button disabled={!canSubmit} className="rounded bg-gray-900 px-4 py-2 text-white hover:bg-black disabled:opacity-50">
            Envoyer l’invitation (création)
          </button>
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
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2 text-left">Campagne</th>
                <th className="px-3 py-2 text-left">Sponsor</th>
                <th className="px-3 py-2 text-center">Statut</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">{r.email}</td>
                  <td className="px-3 py-2">{campaigns.find(c => c.id === r.campaign_id)?.label || r.campaign_id}</td>
                  <td className="px-3 py-2">{sponsors.find(s => s.id === r.sponsor_id)?.label || '-'}</td>
                  <td className="px-3 py-2 text-center">{r.status || '-'}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-500">Aucune invitation</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
