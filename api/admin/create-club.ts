// /api/admin/create-club.ts
import { createClient, type User } from '@supabase/supabase-js'
import { Resend } from 'resend'

const URL = process.env.SUPABASE_URL!
const ANON = process.env.SUPABASE_ANON_KEY!
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!
const RESEND = process.env.RESEND_API_KEY || ''
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'https://sponsor.a2display.fr'
const REDIRECT = `${PUBLIC_BASE_URL}/login`

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok:false, message:'Method Not Allowed' })

  try {
    // 0) AuthN appelant & rôle super_admin
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ ok:false, message:'Missing token' })

    const sbUser = createClient(URL, ANON, { global: { headers: { Authorization: `Bearer ${token}` } } })
    const { data: me } = await sbUser.auth.getUser()
    if (!me?.user?.id) return res.status(401).json({ ok:false, message:'Invalid session' })

    const { data: roleRow, error: roleErr } = await sbUser
      .from('app_users').select('role').eq('id', me.user.id).single()
    if (roleErr || roleRow?.role !== 'super_admin') {
      return res.status(403).json({ ok:false, message:'Forbidden: super_admin only' })
    }

    // 1) payload
    const { name, email_contact, admin_email, phone, address } = req.body || {}
    if (!name || !admin_email) {
      return res.status(400).json({ ok:false, message:'name and admin_email required' })
    }

    const sbAdmin = createClient(URL, SERVICE)

    // 2) Upsert tenant (club)
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
    if (tenErr) return res.status(400).json({ ok:false, message:'tenants upsert failed', detail: tenErr.message })

    // 3) Créer ou retrouver l’utilisateur Auth (admin du club) AVANT d’insérer dans app_users
    //   → on force la redirection de l’e-mail d’activation vers la prod
    let authUser: User | null = null

    // Essai "createUser" (déclenche invitation). Si déjà existant, on retombe sur listUsers.
    const created = await sbAdmin.auth.admin.createUser({
      email: admin_email,
      email_confirm: false,
      app_metadata: { role: 'club_admin' },
      email_redirect_to: REDIRECT, // 👈 IMPORTANT
    })

    if (created.error) {
      // fallback: retrouver l'utilisateur existant par listUsers
      const listed = await sbAdmin.auth.admin.listUsers({ page: 1, perPage: 200 } as any)
      const found = listed?.data?.users?.find(u => u.email?.toLowerCase() === admin_email.toLowerCase())
      if (!found) return res.status(400).json({ ok:false, message:`Auth user create failed: ${created.error.message}` })
      authUser = found as unknown as User
      // on s’assure du rôle
      await sbAdmin.auth.admin.updateUserById(authUser.id, { app_metadata: { role: 'club_admin' } }).catch(()=>{})
    } else {
      authUser = created.data.user as unknown as User
    }

    // 4) Insérer/mettre à jour app_users avec l’ID Auth (FK OK)
    const { error: upErr } = await sbAdmin
      .from('app_users')
      .upsert({
        id: authUser.id,
        email: admin_email,
        role: 'club_admin',
        tenant_id: tenant.id
      }, { onConflict: 'id' })
    if (upErr) return res.status(400).json({ ok:false, message:'app_users upsert failed', detail: upErr.message })

    // 5) (Optionnel) Welcome e-mail via Resend (non bloquant)
    if (RESEND) {
      try {
        const resend = new Resend(RESEND)
        await resend.emails.send({
          from: 'noreply@notifications.a2display.fr',
          to: admin_email,
          cc: email_contact || undefined,
          subject: `Bienvenue — Accès administrateur pour ${tenant.name}`,
          html: `
            <p>Bonjour,</p>
            <p>Un compte administrateur a été créé pour <b>${tenant.name}</b>.</p>
            <p>Activez votre accès via l'e-mail d’invitation reçu, puis connectez-vous&nbsp;:</p>
            <p><a href="${PUBLIC_BASE_URL}/login">${PUBLIC_BASE_URL}/login</a></p>
            <p>Contact du club : ${tenant.email_contact || '—'}</p>
          `,
          text: `Bienvenue. Connectez-vous sur ${PUBLIC_BASE_URL}/login`,
          reply_to: tenant.email_contact || 'contact@a2display.fr'
        })
      } catch { /* ignore */ }
    }

    return res.status(200).json({ ok:true, tenant_id: tenant.id, admin_user_id: authUser.id })
  } catch (e:any) {
    return res.status(500).json({ ok:false, message: e?.message || 'Server error' })
  }
}
