import { useEffect, useState } from 'react'
import supabase from '@/lib/supabase'
import { useTenant } from '@/contexts/TenantContext'


export default function ClubInvitationsPage() {
  const { activeTenant, loading } = useTenant()
  const [rows, setRows] = useState<any[]>([])
  const [err, setErr] = useState<string|null>(null)
  const tenantId = activeTenant?.id

  useEffect(() => {
    (async () => {
      if (loading || !tenantId) return
      setErr(null)
      // on remonte via campaigns (tenant_id) -> invitations
      const { data, error } = await supabase
        .from('invitations')
        .select('id,email,status,created_at,campaigns!inner(title,tenant_id)')
        .eq('campaigns.tenant_id', tenantId)
        .order('created_at', { ascending: false })
      if (error) setErr(error.message)
      else setRows(data || [])
    })()
  }, [loading, tenantId])

  if (loading) return <div>Chargement…</div>
  if (!tenantId) return <div>Aucun club actif</div>

  return (
    <div>
      <h1 className="mb-3 text-2xl font-semibold">Invitations</h1>
      {err && <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:border-red-900">{err}</div>}
      <div className="rounded-lg border dark:border-zinc-700 overflow-auto">
        <table className="w-full min-w-[820px]">
          <thead className="bg-gray-50 dark:bg-zinc-800">
            <tr>
              <th className="p-3 text-left text-sm font-medium">Campagne</th>
              <th className="p-3 text-left text-sm font-medium">Email</th>
              <th className="p-3 text-left text-sm font-medium">Statut</th>
              <th className="p-3 text-left text-sm font-medium">Envoyée le</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.id} className="border-t dark:border-zinc-700">
                <td className="p-3">{(r as any).campaigns?.title || '—'}</td>
                <td className="p-3">{r.email}</td>
                <td className="p-3">{r.status}</td>
                <td className="p-3">{new Date(r.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {!rows.length && <tr><td className="p-3" colSpan={4}>Aucune invitation</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
