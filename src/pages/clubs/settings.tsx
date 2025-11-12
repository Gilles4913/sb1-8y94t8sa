import { useEffect, useState } from 'react'
import supabase from '@/lib/supabase'
import { useTenant } from '@/contexts/TenantContext'

type Club = {
  id: string
  name: string
  email_contact: string | null
  primary_color: string | null
  secondary_color: string | null
  email_signature_html: string | null
  rgpd_content_md: string | null
  cgu_content_md: string | null
  privacy_content_md: string | null
  status: 'active' | 'inactive'
}

export default function ClubSettingsPage() {
  const { tenant } = useTenant()
  const [club, setClub] = useState<Club | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!tenant) return
    ;(async () => {
      setLoading(true); setErr(null)
      const { data, error } = await supabase
        .from('tenants')
        .select('id, name, email_contact, primary_color, secondary_color, email_signature_html, rgpd_content_md, cgu_content_md, privacy_content_md, status')
        .eq('id', tenant.id)
        .maybeSingle()
      if (error) setErr(error.message)
      setClub(data as Club)
      setLoading(false)
    })()
  }, [tenant])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenant || !club) return
    setSaving(true); setMsg(null); setErr(null)
    const { error } = await supabase
      .from('tenants')
      .update({
        name: club.name,
        email_contact: club.email_contact,
        primary_color: club.primary_color,
        secondary_color: club.secondary_color,
        email_signature_html: club.email_signature_html,
        rgpd_content_md: club.rgpd_content_md,
        cgu_content_md: club.cgu_content_md,
        privacy_content_md: club.privacy_content_md,
        status: club.status,
      })
      .eq('id', tenant.id)
    if (error) setErr(error.message)
    else setMsg('Modifications enregistrées ✅')
    setSaving(false)
  }

  if (!tenant) return <div className="p-6 text-red-600">Aucun club actif.</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Réglages du club</h1>

      {loading ? (
        <div>Chargement…</div>
      ) : err ? (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{err}</div>
      ) : club ? (
        <form onSubmit={save} className="space-y-4 rounded border bg-white p-4 shadow-sm">
          {msg && <div className="rounded border border-green-200 bg-green-50 p-2 text-green-700">{msg}</div>}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm text-gray-600">Nom du club</label>
              <input className="mt-1 w-full rounded border px-3 py-2"
                value={club.name || ''}
                onChange={e => setClub({ ...club, name: e.target.value })}
                required />
            </div>

            <div>
              <label className="text-sm text-gray-600">Email de contact</label>
              <input className="mt-1 w-full rounded border px-3 py-2" type="email"
                value={club.email_contact || ''}
                onChange={e => setClub({ ...club, email_contact: e.target.value })} />
            </div>

            <div>
              <label className="text-sm text-gray-600">Couleur primaire (hex)</label>
              <input className="mt-1 w-full rounded border px-3 py-2" placeholder="#0f172a"
                value={club.primary_color || ''}
                onChange={e => setClub({ ...club, primary_color: e.target.value })} />
            </div>

            <div>
              <label className="text-sm text-gray-600">Couleur secondaire (hex)</label>
              <input className="mt-1 w-full rounded border px-3 py-2" placeholder="#22c55e"
                value={club.secondary_color || ''}
                onChange={e => setClub({ ...club, secondary_color: e.target.value })} />
            </div>

            <div>
              <label className="text-sm text-gray-600">Statut</label>
              <select className="mt-1 w-full rounded border px-3 py-2"
                value={club.status}
                onChange={e => setClub({ ...club, status: e.target.value as Club['status'] })}>
                <option value="active">Actif</option>
                <option value="inactive">Suspendu</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600">Signature e-mail (HTML)</label>
            <textarea className="mt-1 h-24 w-full rounded border px-3 py-2 font-mono"
              value={club.email_signature_html || ''}
              onChange={e => setClub({ ...club, email_signature_html: e.target.value })} />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm text-gray-600">RGPD (Markdown)</label>
              <textarea className="mt-1 h-40 w-full rounded border px-3 py-2 font-mono"
                value={club.rgpd_content_md || ''}
                onChange={e => setClub({ ...club, rgpd_content_md: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-gray-600">CGU (Markdown)</label>
              <textarea className="mt-1 h-40 w-full rounded border px-3 py-2 font-mono"
                value={club.cgu_content_md || ''}
                onChange={e => setClub({ ...club, cgu_content_md: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-gray-600">Confidentialité (Markdown)</label>
              <textarea className="mt-1 h-40 w-full rounded border px-3 py-2 font-mono"
                value={club.privacy_content_md || ''}
                onChange={e => setClub({ ...club, privacy_content_md: e.target.value })} />
            </div>
          </div>

          <div className="flex gap-2">
            <button className="rounded bg-gray-900 px-4 py-2 text-white hover:bg-black disabled:opacity-50" disabled={saving}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      ) : (
        <div>Aucun club trouvé.</div>
      )}
    </div>
  )
}
