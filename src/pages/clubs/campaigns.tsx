import { useEffect, useState } from 'react'
import supabase from '@/lib/supabase'
import { useTenant } from '@/contexts/TenantContext'

export default function ClubCampaignsPage() {
  const { tenant } = useTenant()
  const [rows, setRows] = useState<any[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenant) return
    ;(async () => {
      setLoading(true); setErr(null)
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, title, objective_amount, screen_type, deadline')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false })
      if (error) setErr(error.message)
      setRows(data || [])
      setLoading(false)
    })()
  }, [tenant])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Campagnes</h1>
      {err && <div className="rounded border border-red-200 bg-red-50 p-2 text-red-700">{err}</div>}

      <div className="card">
        {loading ? (
          <div className="p-4">Chargement…</div>
        ) : (
          <div className="overflow-auto">
            <table className="table">
              <thead className="thead">
                <tr>
                  <th className="px-3 py-2 text-left">Titre</th>
                  <th className="px-3 py-2 text-right">Objectif (€)</th>
                  <th className="px-3 py-2 text-left">Type écran</th>
                  <th className="px-3 py-2 text-left">Échéance</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} className="trow-hover">
                    <td className="px-3 py-2">{r.title}</td>
                    <td className="px-3 py-2 text-right">{(r.objective_amount || 0).toLocaleString('fr-FR')}</td>
                    <td className="px-3 py-2">{r.screen_type || '-'}</td>
                    <td className="px-3 py-2">{r.deadline ? new Date(r.deadline).toLocaleDateString('fr-FR') : '-'}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-500">Aucune campagne</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
