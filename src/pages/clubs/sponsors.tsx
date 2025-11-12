import { useEffect, useState } from 'react'
import supabase from '@/lib/supabase'
import { useTenant } from '@/contexts/TenantContext'

export default function ClubSponsorsPage() {
  const { tenant } = useTenant()
  const [rows, setRows] = useState<any[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenant) return
    ;(async () => {
      setLoading(true); setErr(null)
      const { data, error } = await supabase
        .from('sponsors')
        .select('id, company, contact_name, email, segment')
        .eq('tenant_id', tenant.id)
        .order('company', { ascending: true })
      if (error) setErr(error.message)
      setRows(data || [])
      setLoading(false)
    })()
  }, [tenant])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Sponsors</h1>

      {err && <div className="rounded border border-red-200 bg-red-50 p-2 text-red-700">{err}</div>}

      <div className="card">
        {loading ? (
          <div className="p-4">Chargement…</div>
        ) : (
          <div className="overflow-auto">
            <table className="table">
              <thead className="thead">
                <tr>
                  <th className="px-3 py-2 text-left">Entreprise</th>
                  <th className="px-3 py-2 text-left">Contact</th>
                  <th className="px-3 py-2 text-left">Email</th>
                  <th className="px-3 py-2 text-left">Segment</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} className="trow-hover">
                    <td className="px-3 py-2">{r.company}</td>
                    <td className="px-3 py-2">{r.contact_name || '-'}</td>
                    <td className="px-3 py-2">{r.email || '-'}</td>
                    <td className="px-3 py-2">{r.segment || '-'}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-500">Aucun sponsor</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
