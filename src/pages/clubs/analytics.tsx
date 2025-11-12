import { useEffect, useMemo, useState } from 'react'
import supabase from '@/lib/supabase'
import { useTenant } from '@/contexts/TenantContext'

type Row = {
  campaign_id: string
  campaign_title: string
  objective_amount: number | null
  raised: number
  yes_count: number
  maybe_count: number
  no_count: number
}

export default function ClubAnalyticsPage() {
  const { tenant } = useTenant()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [ai, setAi] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  const kpis = useMemo(() => {
    const totalObjective = rows.reduce((a, r) => a + (r.objective_amount || 0), 0)
    const totalRaised = rows.reduce((a, r) => a + r.raised, 0)
    const progress = totalObjective > 0 ? (totalRaised / totalObjective) * 100 : 0
    return { totalObjective, totalRaised, progress }
  }, [rows])

  useEffect(() => {
    if (!tenant) return
    ;(async () => {
      setLoading(true); setErr(null)
      try {
        // campagnes du club
        const { data: cs, error: cErr } = await supabase
          .from('campaigns')
          .select('id, title, objective_amount')
          .eq('tenant_id', tenant.id)
        if (cErr) throw cErr

        // pledges groupés
        const { data: pledges, error: pErr } = await supabase
          .from('pledges')
          .select('campaign_id, status, amount')
          .in('campaign_id', (cs || []).map(c => c.id))
        if (pErr) throw pErr

        const byCampaign: Record<string, Row> = {}
        for (const c of cs || []) {
          byCampaign[c.id] = {
            campaign_id: c.id,
            campaign_title: c.title,
            objective_amount: c.objective_amount ?? null,
            raised: 0,
            yes_count: 0,
            maybe_count: 0,
            no_count: 0,
          }
        }
        for (const p of pledges || []) {
          const r = byCampaign[p.campaign_id]
          if (!r) continue
          if (p.status === 'yes') { r.yes_count += 1; r.raised += p.amount || 0 }
          else if (p.status === 'maybe') { r.maybe_count += 1 }
          else if (p.status === 'no') { r.no_count += 1 }
        }
        setRows(Object.values(byCampaign))
      } catch (e: any) {
        setErr(e.message || 'Erreur chargement analytics')
      } finally {
        setLoading(false)
      }
    })()
  }, [tenant])

  const fetchAI = async () => {
    if (!tenant) return
    setAiLoading(true); setAi(null)
    try {
      const res = await fetch(`/api/ai/club-insights?tenant_id=${tenant.id}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setAi(json?.insights || '(Aucun insight généré)')
    } catch (e: any) {
      setAi(`(Pas d’IA disponible : ${e.message}. Un résumé simple est fourni ci-dessous.)`)
    } finally {
      setAiLoading(false)
    }
  }

  if (!tenant) return <div className="p-6 text-red-600">Aucun club actif.</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Analyse des résultats</h1>

      {loading ? (
        <div>Chargement…</div>
      ) : err ? (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{err}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="text-sm text-gray-500">Objectif cumulé</div>
              <div className="mt-1 text-3xl font-bold">
                {kpis.totalObjective.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </div>
            </div>
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="text-sm text-gray-500">Promesses cumulées</div>
              <div className="mt-1 text-3xl font-bold">
                {kpis.totalRaised.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </div>
            </div>
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="text-sm text-gray-500">Objectif atteint</div>
              <div className="mt-1 text-3xl font-bold">
                {kpis.progress.toFixed(0)}%
              </div>
            </div>
          </div>

          <div className="overflow-auto rounded border bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left">Campagne</th>
                  <th className="px-3 py-2 text-right">Objectif (€)</th>
                  <th className="px-3 py-2 text-right">Collecté (€)</th>
                  <th className="px-3 py-2 text-center">Progression</th>
                  <th className="px-3 py-2 text-center">Oui</th>
                  <th className="px-3 py-2 text-center">Peut-être</th>
                  <th className="px-3 py-2 text-center">Non</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(r => {
                  const progress = r.objective_amount ? Math.min(100, (r.raised / r.objective_amount) * 100) : 0
                  return (
                    <tr key={r.campaign_id} className="hover:bg-gray-50">
                      <td className="px-3 py-2">{r.campaign_title}</td>
                      <td className="px-3 py-2 text-right">{(r.objective_amount || 0).toLocaleString('fr-FR')}</td>
                      <td className="px-3 py-2 text-right">{r.raised.toLocaleString('fr-FR')}</td>
                      <td className="px-3 py-2 text-center">{progress.toFixed(0)}%</td>
                      <td className="px-3 py-2 text-center">{r.yes_count}</td>
                      <td className="px-3 py-2 text-center">{r.maybe_count}</td>
                      <td className="px-3 py-2 text-center">{r.no_count}</td>
                    </tr>
                  )
                })}
                {rows.length === 0 && (
                  <tr><td colSpan={7} className="px-3 py-6 text-center text-gray-500">Aucune donnée</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="rounded border bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Insights IA</h2>
              <button
                onClick={fetchAI}
                className="rounded bg-gray-900 px-3 py-1 text-sm text-white hover:bg-black disabled:opacity-50"
                disabled={aiLoading}
              >
                {aiLoading ? 'Analyse…' : 'Analyser avec l’IA'}
              </button>
            </div>
            {ai ? (
              <div className="whitespace-pre-wrap text-sm">{ai}</div>
            ) : (
              <div className="text-sm text-gray-500">Cliquez sur le bouton pour générer une analyse synthétique à partir des performances actuelles.</div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
