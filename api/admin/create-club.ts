import { createClient, type User } from '@supabase/supabase-js'
import { Resend } from 'resend'

const URL = process.env.SUPABASE_URL!
const ANON = process.env.SUPABASE_ANON_KEY!
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!
const resendKey = process.env.RESEND_API_KEY!
const baseUrl = process.env.PUBLIC_BASE_URL || 'https://sponsor.a2display.fr'

const sbAdmin = createClient(URL, SERVICE)

async function getOrCreateAuthUserByEmail(email: string): Promise<User> {
  // 1) Essayer de lister les users et trouver par email
  const listed = await sbAdmin.auth.admin.listUsers({ page: 1, perPage: 200 } as any)
  if (listed?.data?.users?.length) {
    const found = listed.data.users.find(u =>
      u.email?.toLowerCase() === email.toLowerCase()
    )
    if (found) return found as unknown as User
  }

  // 2) Sinon, essayer createUser (crée le user + déclenche l’email d’activation)
  const created = await sbAdmin.auth.admin.createUser({
    email,
    email_confirm: false,               // envoie l’email de validation
    app_metadata: { role: 'club_admin' }
  })
  if (created.error) {
    // Si "already registered", on reliste pour récupérer l'id
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
  try {
    // AuthN appelant
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ ok:false, message:'Missing token' })

    const sbUser = createClient(URL, ANON, { global: { headers: { Authorization: `Bearer ${token}` } } })
    const { data: me } = await sbUser.auth.getUser()
    if (!me?.user?.id) return res.status(401).json({ ok:false, message:'Invalid session' })

    // Rôle = super_admin
    const { data: roleRow, error: roleErr } = await sbUser
      .from('app_users').select('role').eq('id', me.user.id).single()
    if (roleErr || roleRow?.role !== 'super_admin') {
      return res.status(403).json({ ok:false, message:'Forbidden: super_admin only' })
    }

    const { name, email_contact, admin_email, phone, address } = req.body || {}
    if (!name || !admin_email) return res.status(400).json({ ok:false, message:'name and admin_email required' })

    // 1) Upsert tenant d’abord (id nécessaire pour lier l’admin ensuite)
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
    if (tenErr) return res.status(400).json({ ok:false, message: tenErr.message })

    // 2) CRUCIAL : créer/trouver l’utilisateur Auth (auth.users) AVANT d’insérer app_users
    const authUser = await getOrCreateAuthUserByEmail(admin_email)
    const auth_uid = authUser.id

    // S’assurer du role dans app_metadata (idempotent)
    await sbAdmin.auth.admin.updateUserById(auth_uid, { app_metadata: { role: 'club_admin' } })

    // 3) Upsert app_users avec l’ID Auth —> évite l’erreur FK
    const { error: upErr } = await sbAdmin
      .from('app_users')
      .upsert({ id: auth_uid, email: admin_email, role: 'club_admin', tenant_id: tenant.id }, { onConflict: 'id' })
    if (upErr) return res.status(400).json({ ok:false, message: upErr.message })

    // 4) (optionnel) Welcome mail via Resend
    try {
      if (resendKey) {
        const resend = new Resend(resendKey)
        await resend.emails.send({
          from: 'noreply@notifications.a2display.fr',
          to: admin_email,
          cc: email_contact || undefined,               // facultatif: copie au contact club
          subject: `Bienvenue — Accès admin pour ${tenant.name}`,
          html: `<p>Bonjour,</p>
                 <p>Un compte administrateur a été créé pour <b>${tenant.name}</b>.</p>
                 <p>Finalisez l’activation via l’e-mail Supabase reçu, puis connectez-vous :</p>
                 <p><a href="${baseUrl}/login">${baseUrl}/login</a></p>
                 <p>Contact du club : ${tenant.email_contact || '—'}</p>`,
          reply_to: tenant.email_contact || 'contact@a2display.fr'
        })
      }
    } catch { /* non bloquant */ }

    return res.status(200).json({ ok:true, tenant_id: tenant.id, admin_user_id: auth_uid })
  } catch (e:any) {
    return res.status(500).json({ ok:false, message: e?.message || 'Server error' })
  }
}
