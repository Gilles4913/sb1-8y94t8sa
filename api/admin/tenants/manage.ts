// /api/admin/tenants/manage.ts
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL!
const service = process.env.SUPABASE_SERVICE_ROLE_KEY!

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' })

    // 1) Auth requise (utilisateur connecté côté front)
    const auth = req.headers.authorization || ''
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'unauthorized' })

    // 2) Client service role
    const admin = createClient(url, service)

    const { action, payload } = req.body || {}
    if (!action) return res.status(400).json({ error: 'missing_action' })

    // ————————————————————————————————
    // CREATE
    if (action === 'create') {
      // payload: { name, email_contact?, primary_color?, secondary_color? }
      const { name, email_contact, primary_color, secondary_color } = payload || {}
      if (!name) return res.status(400).json({ error: 'missing_name' })

      const { data, error } = await admin
        .from('tenants')
        .insert({
          name,
          email_contact: email_contact || null,
          primary_color: primary_color || null,
          secondary_color: secondary_color || null,
          status: 'active',
        })
        .select('id, name, email_contact, status')
        .single()

      if (error) return res.status(400).json({ error: error.message })
      return res.status(200).json({ ok: true, tenant: data })
    }

    // ————————————————————————————————
    // UPDATE (édition champs simples)
    if (action === 'update') {
      // payload: { id, name?, email_contact?, primary_color?, secondary_color? }
      const { id, ...rest } = payload || {}
      if (!id) return res.status(400).json({ error: 'missing_id' })

      const { data, error } = await admin
        .from('tenants')
        .update({
          name: rest.name ?? undefined,
          email_contact: rest.email_contact ?? undefined,
          primary_color: rest.primary_color ?? undefined,
          secondary_color: rest.secondary_color ?? undefined,
        })
        .eq('id', id)
        .select('id, name, email_contact, status')
        .single()

      if (error) return res.status(400).json({ error: error.message })
      return res.status(200).json({ ok: true, tenant: data })
    }

    // ————————————————————————————————
    // SUSPEND / ACTIVATE
    if (action === 'suspend' || action === 'activate') {
      const { id } = payload || {}
      if (!id) return res.status(400).json({ error: 'missing_id' })
      const status = action === 'suspend' ? 'inactive' : 'active'

      const { data, error } = await admin
        .from('tenants')
        .update({ status })
        .eq('id', id)
        .select('id, name, email_contact, status')
        .single()

      if (error) return res.status(400).json({ error: error.message })
      return res.status(200).json({ ok: true, tenant: data })
    }

    // ————————————————————————————————
    // DELETE (cascade logique)
    if (action === 'delete') {
      // payload: { id }
      const { id } = payload || {}
      if (!id) return res.status(400).json({ error: 'missing_id' })

      // Supprime d’abord les entités liées (ordre pour éviter contraintes FK)
      // (adapte si certaines tables n’existent pas chez toi)
      const tables = [
        'email_templates',
        'email_events',
        'pledges',
        'invitations',
        'campaigns',
        'sponsors',
        'app_users', // utilisateurs club
      ]

      for (const t of tables) {
        const { error } = await admin.from(t).delete().eq('tenant_id', id)
        if (error && error.code !== 'PGRST116') { // ignore "no rows"
          return res.status(400).json({ error: `delete_${t}: ${error.message}` })
        }
      }

      // Enfin supprime le tenant
      const { error: delErr } = await admin.from('tenants').delete().eq('id', id)
      if (delErr) return res.status(400).json({ error: delErr.message })

      return res.status(200).json({ ok: true })
    }

    return res.status(400).json({ error: 'unknown_action' })
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'server_error' })
  }
}
