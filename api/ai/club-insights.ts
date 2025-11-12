// /api/ai/club-insights.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const tenant_id = String(req.query.tenant_id || '')
    if (!tenant_id) return res.status(400).json({ error: 'tenant_id requis' })

    const sb = createClient(supabaseUrl, serviceKey)

    // Récup données agrégées
    const { data: campaigns, error: cErr } = await sb
      .from('campaigns')
      .select('id, title, objective_amount')
      .eq('tenant_id', tenant_id)
    if (cErr) throw cErr

    const { data: pledges, error: pErr } = await sb
      .from('pledges')
      .select('campaign_id, status, amount')
      .in('campaign_id', (campaigns || []).map(c => c.id))
    if (pErr) throw pErr

    const byId: Record<string, { title: string; objective: number; raised: number; yes: number; maybe: number; no: number }> = {}
    for (const c of campaigns || []) {
      byId[c.id] = { title: c.title, objective: c.objective_amount || 0, raised: 0, yes: 0, maybe: 0, no: 0 }
    }
    for (const p of pledges || []) {
      const t = byId[p.campaign_id]; if (!t) continue
      if (p.status === 'yes') { t.yes++; t.raised += p.amount || 0 }
      else if (p.status === 'maybe') t.maybe++
      else if (p.status === 'no') t.no++
    }

    const rows = Object.values(byId)
    const totalObjective = rows.reduce((a, r) => a + r.objective, 0)
    const totalRaised = rows.reduce((a, r) => a + r.raised, 0)

    // Fallback heuristique si pas d'IA
    let insights = `Objectif cumulé: ${(totalObjective).toLocaleString('fr-FR')} €. Collecte: ${(totalRaised).toLocaleString('fr-FR')} €.\n`
    if (rows.length) {
      const worst = [...rows].sort((a, b) => (a.objective ? a.raised / a.objective : 0) - (b.objective ? b.raised / b.objective : 0))[0]
      const best = [...rows].sort((a, b) => (b.objective ? b.raised / b.objective : 0) - (a.objective ? a.raised / a.objective : 0))[0]
      insights += `Meilleure campagne: ${best.title} (${best.objective ? Math.round((best.raised / best.objective) * 100) : 0}%). `
      insights += `À renforcer: ${worst.title} (${worst.objective ? Math.round((worst.raised / worst.objective) * 100) : 0}%).\n`
      const maybeTotal = rows.reduce((a, r) => a + r.maybe, 0)
      if (maybeTotal > 0) insights += `Priorité: rappeler ${maybeTotal} “peut-être” avec une offre claire (durée/visibilité/prix).\n`
    }

    // Si clé OpenAI présente → enrichir
    if (OPENAI_API_KEY) {
      const prompt = `
Tu es consultant sponsoring. Résume en 6-8 phrases les forces/faiblesses et les 3 actions prioritaires.
Données:
- Objectif cumulé: ${totalObjective} €
- Collecte cumulée: ${totalRaised} €
- Détail campagnes:
${rows.map(r => `• ${r.title}: objectif ${r.objective} €, collecté ${r.raised} €, oui=${r.yes}, peut-être=${r.maybe}, non=${r.no}`).join('\n')}
Écris en français, ton direct, concret, avec pourcentage quand utile. Termine par 3 puces “Actions” très pratico-pratiques.
      `.trim()

      const body = {
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
      }

      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify(body),
      })
      if (r.ok) {
        const j = await r.json()
        const text = j?.choices?.[0]?.message?.content?.trim()
        if (text) insights = text
      }
    }

    return res.status(200).json({ insights })
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'server_error' })
  }
}
