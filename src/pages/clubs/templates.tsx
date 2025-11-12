import { useEffect, useMemo, useState } from 'react'
import supabase from '@/lib/supabase'
import { useTenant } from '@/contexts/TenantContext'

type Template = {
  id: string
  tenant_id: string | null
  key: string
  subject: string | null
  html: string | null
  text_body: string | null
}

export default function ClubEmailTemplatesPage() {
  const { tenant } = useTenant()
  const [items, setItems] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  const [current, setCurrent] = useState<Template | null>(null)
  const [form, setForm] = useState<Partial<Template>>({ subject: '', html: '', text_body: '' })

  const load = async () => {
    if (!tenant) return
    setLoading(true); setErr(null)
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('id, tenant_id, key, subject, html, text_body')
        .or(`tenant_id.is.null,tenant_id.eq.${tenant.id}`)
        .order('tenant_id', { ascending: false }) // d’abord les spécifiques tenant
        .order('key', { ascending: true })
      if (error) throw error
      setItems(data || [])
    } catch (e: any) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [tenant])

  const templatesGrouped = useMemo(() => {
    const globals = items.filter(t => !t.tenant_id)
    const locals = items.filter(t => !!t.tenant_id)
    return { globals, locals }
  }, [items])

  const edit = (t: Template) => {
    setCurrent(t)
    setForm({ subject: t.subject || '', html: t.html || '', text_body: t.text_body || '' })
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!current) return
    const payload = {
      subject: form.subject || null,
      html: form.html || null,
      text_body: form.text_body || null,
    }
    const { error } = await supabase.from('email_templates').update(payload).eq('id', current.id)
    if (error) return alert(error.message)
    setCurrent(null); setForm({ subject: '', html: '', text_body: '' })
    load()
  }

  if (!tenant) return <div className="p-6 text-red-600">Aucun club actif.</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Modèles d’e-mails</h1>

      {loading ? (
        <div>Chargement…</div>
      ) : err ? (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{err}</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded border bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold">Templates du club</h2>
            <ul className="divide-y">
              {templatesGrouped.locals.map(t => (
                <li key={t.id} className="flex items-center justify-between py-2">
                  <div>
                    <div className="font-medium">{t.key}</div>
                    <div className="text-xs text-gray-500">{t.subject || <em>(sans sujet)</em>}</div>
                  </div>
                  <button onClick={() => edit(t)} className="rounded border px-2 py-1 text-xs">Éditer</button>
                </li>
              ))}
              {templatesGrouped.locals.length === 0 && <div className="py-3 text-sm text-gray-500">Aucun template spécifique au club.</div>}
            </ul>

            <h2 className="mb-3 mt-6 text-lg font-semibold">Templates globaux</h2>
            <ul className="divide-y">
              {templatesGrouped.globals.map(t => (
                <li key={t.id} className="flex items-center justify-between py-2">
                  <div>
                    <div className="font-medium">{t.key}</div>
                    <div className="text-xs text-gray-500">{t.subject || <em>(sans sujet)</em>}</div>
                  </div>
                  <button onClick={() => edit(t)} className="rounded border px-2 py-1 text-xs">Éditer</button>
                </li>
              ))}
              {templatesGrouped.globals.length === 0 && <div className="py-3 text-sm text-gray-500">Aucun template global.</div>}
            </ul>
          </div>

          <div className="rounded border bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold">Édition</h2>
            {!current ? (
              <div className="text-sm text-gray-500">Sélectionnez un template à gauche</div>
            ) : (
              <form onSubmit={save} className="space-y-3">
                <div className="text-sm">
                  <div><b>Clé :</b> {current.key}</div>
                  <div><b>Portée :</b> {current.tenant_id ? 'Club' : 'Global'}</div>
                </div>
                <input className="w-full rounded border px-3 py-2" placeholder="Sujet"
                  value={form.subject || ''} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
                <textarea className="h-40 w-full rounded border px-3 py-2 font-mono" placeholder="HTML"
                  value={form.html || ''} onChange={e => setForm(f => ({ ...f, html: e.target.value }))} />
                <textarea className="h-32 w-full rounded border px-3 py-2 font-mono" placeholder="Texte brut"
                  value={form.text_body || ''} onChange={e => setForm(f => ({ ...f, text_body: e.target.value }))} />
                <div className="flex items-center gap-2">
                  <button className="rounded bg-gray-900 px-4 py-2 text-white hover:bg-black" type="submit">Enregistrer</button>
                  <button className="rounded border px-4 py-2" type="button" onClick={() => { setCurrent(null); setForm({}) }}>Annuler</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
