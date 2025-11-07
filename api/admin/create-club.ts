import { createClient, type User } from '@supabase/supabase-js'
import { Resend } from 'resend'

const URL = process.env.SUPABASE_URL!
const ANON = process.env.SUPABASE_ANON_KEY!
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!
const resendKey = process.env.RESEND_API_KEY!
const baseUrl = process.env.PUBLIC_BASE_URL || 'https://sponsor.a2display.fr'

const sbAdmin = createClient(URL, SERVICE)

async function getOrCreateAuthUserByEmail(email: string): Promise<User> {
  // essaie de trouver par listUsers (pas de recherche directe dispo)
  const listed = await sbAdmin.auth.admin.listUsers({ page: 1, perPage: 200 } as any)
  if (listed?.data?.users?.length) {
    const found = listed.data.users.find(u => u.email?.toLowerCase() === email.toLowerCase())
    if (found) return found as unknown as User
  }
  // sinon crée (déclenche l’email d’activation)
  const created = await sbAdmin.auth.admin.createUser({
    email,
    email_confirm: false,
    app_metadata: { role: 'club_admin' }
  })
  if (created.error) {
    // si already registered → on reliste pour récupérer l’id
    if (/already/i.test(created.error.message)) {
      const relist = await sbAdmin.auth.admin.listUsers({ page: 1, perPage: 200 } as any)
      const again = relist?.data?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())
      if (again) return again as unknown as User
    }
    throw created.error
  }
  return created.data.user as unknown as User
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok:false, message:'Method Not Allowed' })

  const result: any = { ok:false, steps:{} }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ ok:false, message:'Missing token' })

    const sbUser = createClient(URL, ANON, { global: { headers: { Authorization: `Bearer ${token}` } } })
    const { data: me } = await sbUser.auth.getUser()
    if (!me?.user?.id) return res.status(401).json({ ok:false, message:'Invalid session' })

    // rôle super_admin ?
    const { data: roleRow, error: roleErr } = await sbUser
      .from('app_users').select('role').eq('id', me.user.id).single()
    if (roleErr || roleRow?.role !== 'super_admin') {
      return res.status(403).json({ ok:false, message:'Forbidden: super_admin only', debug: { roleErr } })
    }

    const { name, email_contact, admin_email, phone, address } = req.body || {}
    if (!name || !admin_email) return res.status(400).json({ ok:false, message:'name and admin_email required' })

    // 1) upsert tenant
    const { data: tenant, error: tenErr } = await sbAdmin
      .from('tenants')
      .upsert({
        name,
        email_contact: email_contact || null,
        phone: phone || null,
        address: address || null,
        status: 'active'
      }, { onConflict: 'name' })
      .select('id,name,email_contact')
      .single()
    if (tenErr) return res.status(400).json({ ok:false, message:'tenants upsert failed', error: tenErr })

    result.steps.tenant = tenant

    // 2) auth user
    let authUser: User
    try {
      authUser = await getOrCreateAuthUserByEmail(admin_email)
      result.steps.auth_user_id = authUser.id
    } catch (e:any) {
      return res.status(400).json({ ok:false, message:'auth user create/list failed', error: String(e?.message || e) })
    }

    // s’assurer du role dans app_metadata (idempotent)
    await sbAdmin.auth.admin.updateUserById(authUser.id, { app_metadata: { role: 'club_admin' } }).catch(()=>{})

    // 3) INSERT d’abord, puis fallback en UPSERT si conflit (diagnostic plus clair)
    let appUserId: string | null = null
    {
      const { data: ins, error: insErr } = await sbAdmin
        .from('app_users')
        .insert({
          id: authUser.id,
          email: admin_email,
          role: 'club_admin',
          tenant_id: tenant.id
        })
        .select('id')
        .single()

      if (insErr) {
        result.steps.app_users_insert_error = insErr
        // tente un upsert (si la ligne existe déjà)
        const { data: up, error: upErr } = await sbAdmin
          .from('app_users')
          .upsert({
            id: authUser.id,
            email: admin_email,
            role: 'club_admin',
            tenant_id: tenant.id
          }, { onConflict: 'id' })
          .select('id')
          .single()

        if (upErr) {
          return res.status(400).json({
            ok:false,
            message:'app_users insert/upsert failed',
            insert_error: insErr?.message || insErr,
            upsert_error: upErr?.message || upErr
          })
        }
        appUserId = up?.id || authUser.id
      } else {
        appUserId = ins?.id || authUser.id
      }
    }

    result.steps.app_user_id = appUserId

    // 4) welcome via Resend (facultatif, non bloquant)
    if (resendKey) {
      try {
        const resend = new Resend(resendKey)
        await resend.emails.send({
          from: 'noreply@notifications.a2display.fr',
          to: admin_email,
          cc: email_contact || undefined,
          subject: `Bienvenue — Accès admin pour ${tenant.name}`,
          html: `<p>Bonjour,</p>
                <p>Un compte administrateur a été créé pour <b>${tenant.name}</b>.</p>
                <p>Finalisez l’activation via l’e-mail Supabase reçu, puis connectez-vous :</p>
                <p><a href="${baseUrl}/login">${baseUrl}/login</a></p>
                <p>Contact du club : ${tenant.email_contact || '—'}</p>`,
          reply_to: tenant.email_contact || 'contact@a2display.fr'
        })
        result.steps.welcome = 'sent'
      } catch (e:any) {
        result.steps.welcome = `failed: ${String(e?.message || e)}`
      }
    }

    return res.status(200).json({ ok:true, tenant_id: tenant.id, admin_user_id: appUserId, debug: result.steps })
  } catch (e:any) {
    return res.status(500).json({ ok:false, message: e?.message || 'Server error' })
  }
}
