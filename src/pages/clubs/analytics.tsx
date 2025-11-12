import { useEffect, useMemo, useState } from 'react'
import supabase from '@/lib/supabase'
import { useTenant } from '@/contexts/TenantContext'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

type Row = {
  campaign_id: string
  campaign_title: string
  objective_amount: number
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

  // Données pour graphiques
  const barData = useMemo(
    () =>
      rows.map(r => ({
        name: r.campaign_title,
        Objectif: r.objective_amount || 0,
        Collecte: r.raised || 0,
      })),
    [rows]
  )

  const statusTotals = useMemo(() => {
    const yes = rows.reduce((a, r) => a + r.yes_count, 0)
    const maybe = rows.reduce((a, r) => a + r.maybe_count, 0)
    const no = rows.reduce((a, r) => a + r.no_count, 0)
    return [
      { name: 'Oui', value: yes },
      { name: 'Peut-être', value: maybe },
      { name: 'Non', value: no },
    ]
  }, [rows])

  useEffect(() => {
    if (!tenant) return
    ;(async () => {
      setLoading(true); setErr(null)
      try {
        const { data: cs, error: cErr } = await supabase
          .from('campaigns')
          .select('id, title, objective_amount')
          .eq('tenant_id', tenant.id)
        if (cErr) throw cErr

        const campaignIds = (cs || []).map(c => c.id)
        if (campaignIds.length === 0) {
          setRows([])
          setLoading(false)
          return
        }

        const { data: pledges, error: pErr } = await supabase
          .from('pledges')
          .select('campaign_id, status, amount')
          .in('campaign_id', campaignIds)
        if (pErr) throw pErr

        const byCampaign: Record<string, Row> = {}
        for (const c of cs || []) {
          byCampaign[c.id] = {
            campaign_id: c.id,
            campaign_title: c.title,
            objective_amount: c.objective_amount ?? 0,
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Analyse des résultats</h1>
        <button
          onClick={fetchAI}
          className="rounded bg-gray-900 px-3 py-2 text-sm text-white hover:bg-black disabled:opacity-50"
          disabled={aiLoading}
        >
          {aiLoading ? 'Analyse…' : 'Analyser avec l’IA'}
        </button>
      </div>

      {loading ? (
        <div>Chargement…</div>
      ) : err ? (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{err}</div>
      ) : (
        <>
          {/* KPIs */}
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
              <div className="mt-1 text-3xl font-bold">{kpis.progress.toFixed(0)}%</div>
            </div>
          </div>

          {/* Graphiques */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Barres : Objectif vs Collecte par campagne */}
            <div className="rounded border bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold">Objectif vs Collecte par campagne</h2>
              {barData.length === 0 ? (
                <div className="text-sm text-gray-500">Aucune campagne</div>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Objectif" />
                      <Bar dataKey="Collecte" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Secteurs : Répartition Oui/Peut-être/Non (global) */}
            <div className="rounded border bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-lg font-semibold">Répartition des réponses</h2>
              {statusTotals.reduce((s, x) => s + x.value, 0) === 0 ? (
                <div className="text-sm text-gray-500">Aucune réponse enregistrée</div>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Tooltip />
                      <Legend />
                      <Pie
                        data={statusTotals}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={3}
                      >
                        {statusTotals.map((_, idx) => (
                          <Cell key={idx} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Tableau détail */}
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
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                      Aucune donnée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Insights IA */}
          <div className="rounded border bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-lg font-semibold">Insights IA</h2>
            {ai ? (
              <div className="whitespace-pre-wrap text-sm">{ai}</div>
            ) : (
              <div className="text-sm text-gray-500">
                Cliquez sur “Analyser avec l’IA” pour obtenir des recommandations synthétiques basées sur les performances actuelles.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
