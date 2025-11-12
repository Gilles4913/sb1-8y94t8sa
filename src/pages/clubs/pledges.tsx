import { useEffect, useState } from 'react'
import supabase from '@/lib/supabase'
import { useTenant } from '@/contexts/TenantContext'

export default function ClubPledgesPage() {
  const { tenant } = useTenant()
  const [rows, setRows] = useState<any[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenant) return
    ;(async () => {
      setLoading(true); setErr(null)
      const { data, error } = await supabase
        .from('pledges')
        .select('id, amount, status, created_at')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false })
      if (error) setErr(error.message)
      setRows(data || [])
      setLoading(false)
    })()
  }, [tenant])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Promesses</h1>
      {err && <div className="rounded border border-red-200 bg-red-50 p-2 text-red-700">{err}</div>}

      <div className="card">
        {loading ? (
          <div className="p-4">Chargement…</div>
        ) : (
          <div className="overflow-auto">
            <table className="table">
              <thead className="thead">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-right">Montant (€)</th>
                  <th className="px-3 py-2 text-left">Statut</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} className="trow-hover">
                    <td className="px-3 py-2">{new Date(r.created_at).toLocaleString('fr-FR')}</td>
                    <td className="px-3 py-2 text-right">{(r.amount || 0).toLocaleString('fr-FR')}</td>
                    <td className="px-3 py-2">{r.status}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={3} className="px-3 py-6 text-center text-gray-500">Aucune promesse</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
