import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useTenant } from '@/contexts/TenantContext'

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL!, import.meta.env.VITE_SUPABASE_ANON_KEY!)

export default function ClubEmailTemplatesPage() {
  const { activeTenant, loading } = useTenant()
  const [rows, setRows] = useState<any[]>([])
  const [err, setErr] = useState<string|null>(null)
  const tenantId = activeTenant?.id

  useEffect(() => {
    (async () => {
      if (loading) return
      setErr(null)
      // Stratégie : d’abord templates du tenant, sinon globaux (tenant_id IS NULL)
      const { data, error } = await supabase
        .from('email_templates')
        .select('id,tenant_id,key,subject,updated_at,created_at')
        .or(`tenant_id.eq.${tenantId},tenant_id.is.null`)
        .order('tenant_id', { ascending: false })
        .order('created_at', { ascending: false })
      if (error) setErr(error.message)
      else setRows(data || [])
    })()
  }, [loading, tenantId])

  if (loading) return <div>Chargement…</div>

  return (
    <div>
      <h1 className="mb-3 text-2xl font-semibold">Modèles e-mails</h1>
      {err && <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:border-red-900">{err}</div>}
      <div className="rounded-lg border dark:border-zinc-700 overflow-auto">
        <table className="w-full min-w-[820px]">
          <thead className="bg-gray-50 dark:bg-zinc-800">
            <tr>
              <th className="p-3 text-left text-sm font-medium">Portée</th>
              <th className="p-3 text-left text-sm font-medium">Clé</th>
              <th className="p-3 text-left text-sm font-medium">Sujet</th>
              <th className="p-3 text-left text-sm font-medium">MAJ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.id} className="border-t dark:border-zinc-700">
                <td className="p-3">{r.tenant_id ? 'Club' : 'Global'}</td>
                <td className="p-3">{r.key}</td>
                <td className="p-3">{r.subject}</td>
                <td className="p-3">{r.updated_at ? new Date(r.updated_at).toLocaleString() : '—'}</td>
              </tr>
            ))}
            {!rows.length && <tr><td className="p-3" colSpan={4}>Aucun modèle</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
