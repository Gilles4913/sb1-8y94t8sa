import { useEffect, useState } from 'react'
import supabase from '@/lib/supabase'
import { useTenant } from '@/contexts/TenantContext'
import { Link } from 'react-router-dom'

type KPIs = {
  sponsors: number
  campaigns: number
  pledgesSum: number
}

export default function ClubDashboard() {
  const { tenant } = useTenant()
  const [kpi, setKpi] = useState<KPIs>({ sponsors: 0, campaigns: 0, pledgesSum: 0 })
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!tenant) return
    ;(async () => {
      setLoading(true); setErr(null)
      try {
        const [{ count: sCount, error: sErr }, { count: cCount, error: cErr }] = await Promise.all([
          supabase.from('sponsors').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
          supabase.from('campaigns').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant.id),
        ])
        if (sErr) throw sErr
        if (cErr) throw cErr

        // somme des engagements (pledges.amount)
        let pledgesSum = 0
        const { data: pledges, error: pErr } = await supabase
          .from('pledges')
          .select('amount, campaign_id')
          .in('campaign_id', (await supabase
            .from('campaigns')
            .select('id')
            .eq('tenant_id', tenant.id)
          ).data?.map(r => r.id) || [])
        if (pErr) throw pErr
        pledgesSum = (pledges || []).reduce((acc, r: any) => acc + (r?.amount || 0), 0)

        setKpi({ sponsors: sCount || 0, campaigns: cCount || 0, pledgesSum })
      } catch (e: any) {
        setErr(e.message || 'Erreur chargement des indicateurs')
      } finally {
        setLoading(false)
      }
    })()
  }, [tenant])

  if (!tenant) return <div className="p-6 text-red-600">Aucun club actif.</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Tableau de bord — {tenant.name}</h1>

      {loading ? (
        <div>Chargement…</div>
      ) : err ? (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{err}</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="text-sm text-gray-500">Sponsors</div>
            <div className="mt-1 text-3xl font-bold">{kpi.sponsors}</div>
            <Link to="/clubs/sponsors" className="mt-3 inline-block text-sm text-blue-600 hover:underline">Gérer les sponsors</Link>
          </div>
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="text-sm text-gray-500">Campagnes</div>
            <div className="mt-1 text-3xl font-bold">{kpi.campaigns}</div>
            <Link to="/clubs/campaigns" className="mt-3 inline-block text-sm text-blue-600 hover:underline">Gérer les campagnes</Link>
          </div>
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div className="text-sm text-gray-500">Promesses (somme)</div>
            <div className="mt-1 text-3xl font-bold">{kpi.pledgesSum.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</div>
            <Link to="/clubs/invitations" className="mt-3 inline-block text-sm text-blue-600 hover:underline">Invitations & promesses</Link>
          </div>
        </div>
      )}
    </div>
  )
}
