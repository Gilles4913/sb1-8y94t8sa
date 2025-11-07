// /api/admin/tenants/manage.ts
import { createClient } from '@supabase/supabase-js'

const URL = process.env.SUPABASE_URL!
const ANON = process.env.SUPABASE_ANON_KEY!
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!

type Action = 'suspend' | 'restore' | 'delete_hard'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok:false, message:'Method Not Allowed' })
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ ok:false, message:'Missing token' })

    const { tenant_id, action } = req.body as { tenant_id: string; action: Action }
    if (!tenant_id || !action) return res.status(400).json({ ok:false, message:'tenant_id and action required' })

    const sbUser = createClient(URL, ANON, { global: { headers: { Authorization: `Bearer ${token}` } } })
    const { data: me } = await sbUser.auth.getUser()
    if (!me?.user?.id) return res.status(401).json({ ok:false, message:'Invalid session' })

    const { data: roleRow } = await sbUser.from('app_users').select('role').eq('id', me.user.id).single()
    if (roleRow?.role !== 'super_admin') return res.status(403).json({ ok:false, message:'Forbidden: super_admin only' })

    const sbAdmin = createClient(URL, SERVICE)

    if (action === 'suspend') {
      const { error } = await sbAdmin.from('tenants').update({ status: 'inactive' }).eq('id', tenant_id)
      if (error) return res.status(400).json({ ok:false, message: error.message })
      return res.status(200).json({ ok:true, status:'inactive' })
    }

    if (action === 'restore') {
      const { error } = await sbAdmin.from('tenants').update({ status: 'active' }).eq('id', tenant_id)
      if (error) return res.status(400).json({ ok:false, message: error.message })
      return res.status(200).json({ ok:true, status:'active' })
    }

    if (action === 'delete_hard') {
      // 1) Récupérer les users (app_users) de ce tenant pour supprimer aussi auth.users
      const { data: users, error: uErr } = await sbAdmin
        .from('app_users')
        .select('id,email')
        .eq('tenant_id', tenant_id)
      if (uErr) return res.status(400).json({ ok:false, message: uErr.message })

      // 2) Supprimer les données liées (ordre de sécurité si pas de ON DELETE CASCADE)
      // Pledges -> invitations -> email_events -> scenarios -> campaigns -> sponsors -> email_templates (tenant scope)
      // NB: ajuste selon tes noms exacts de tables et FKs
      const deletes = []

      // a) Email templates du tenant (si tu clones des templates par tenant)
      deletes.push(sbAdmin.from('email_templates').delete().eq('tenant_id', tenant_id))
      deletes.push(sbAdmin.from('email_template_versions').delete().in('template_id',
        (await sbAdmin.from('email_templates').select('id').eq('tenant_id', tenant_id)).data?.map(r=>r.id) || []
      )) // safe si vide

      // b) Scenarios (campagnes)
      const { data: campaignIds } = await sbAdmin.from('campaigns').select('id').eq('tenant_id', tenant_id)
      const cids = (campaignIds || []).map(r=>r.id)
      if (cids.length) {
        deletes.push(sbAdmin.from('pledges').delete().in('campaign_id', cids))
        deletes.push(sbAdmin.from('invitations').delete().in('campaign_id', cids))
        deletes.push(sbAdmin.from('email_events').delete().in('campaign_id', cids))
        deletes.push(sbAdmin.from('scenarios').delete().in('campaign_id', cids))
        deletes.push(sbAdmin.from('campaigns').delete().in('id', cids))
      }

      // c) Sponsors
      deletes.push(sbAdmin.from('sponsors').delete().eq('tenant_id', tenant_id))

      // d) Logs annexes éventuels
      deletes.push(sbAdmin.from('email_test_logs').delete().eq('tenant_id', tenant_id))

      // e) app_users (on les supprime après auth.users)
      //   -> on les retirera après suppression des comptes Auth

      // Exécuter les deletes (séquentiel pour récupérer les erreurs)
      for (const p of deletes) {
        const { error } = await p
        if (error) return res.status(400).json({ ok:false, message:`Delete failed: ${error.message}` })
      }

      // 3) Supprimer les comptes Auth (puis nettoyer app_users)
      for (const u of (users || [])) {
        try {
          await sbAdmin.auth.admin.deleteUser(u.id)
        } catch (e:any) {
          // si l'user n'existe plus côté Auth, on continue
        }
      }
      const { error: delAppUsersErr } = await sbAdmin.from('app_users').delete().eq('tenant_id', tenant_id)
      if (delAppUsersErr) return res.status(400).json({ ok:false, message: delAppUsersErr.message })

      // 4) Supprimer le tenant
      const { error: delTenantErr } = await sbAdmin.from('tenants').delete().eq('id', tenant_id)
      if (delTenantErr) return res.status(400).json({ ok:false, message: delTenantErr.message })

      return res.status(200).json({ ok:true, deleted:true })
    }

    return res.status(400).json({ ok:false, message:'Unknown action' })
  } catch (e:any) {
    return res.status(500).json({ ok:false, message: e?.message || 'Server error' })
  }
}
