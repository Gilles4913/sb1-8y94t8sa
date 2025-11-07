// /api/admin/resend-invite.ts
import { createClient } from '@supabase/supabase-js'
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
    // 1) authN & super_admin
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ ok:false, message:'Missing token' })

    const sbUser = createClient(URL, ANON, { global: { headers: { Authorization: `Bearer ${token}` } } })
    const { data: me } = await sbUser.auth.getUser()
    if (!me?.user?.id) return res.status(401).json({ ok:false, message:'Invalid session' })

    const { data: myRole } = await sbUser.from('app_users').select('role').eq('id', me.user.id).single()
    if (myRole?.role !== 'super_admin') return res.status(403).json({ ok:false, message:'Forbidden: super_admin only' })

    const { admin_email } = req.body || {}
    if (!admin_email) return res.status(400).json({ ok:false, message:'admin_email required' })

    const sbAdmin = createClient(URL, SERVICE)

    // 2) renvoyer l’invitation avec bonne redirection
    let link: string | null = null

    if ((sbAdmin as any).auth.admin.inviteUserByEmail) {
      const invited = await (sbAdmin as any).auth.admin.inviteUserByEmail(admin_email, { redirectTo: REDIRECT })
      if (invited?.error) {
        // fallback recovery
        const gl = await sbAdmin.auth.admin.generateLink({ type: 'recovery', email: admin_email, options: { redirectTo: REDIRECT } })
        if (gl.error) return res.status(400).json({ ok:false, message: gl.error.message })
        link = gl.data?.action_link || null
      }
    } else {
      const gl = await sbAdmin.auth.admin.generateLink({ type: 'recovery', email: admin_email, options: { redirectTo: REDIRECT } })
      if (gl.error) return res.status(400).json({ ok:false, message: gl.error.message })
      link = gl.data?.action_link || null
    }

    // 3) Optionnel : envoyer l’email via Resend pour UX
    if (RESEND) {
      try {
        const resend = new Resend(RESEND)
        await resend.emails.send({
          from: 'noreply@notifications.a2display.fr',
          to: admin_email,
          subject: 'Votre lien d’activation administrateur',
          html: `
            <p>Bonjour,</p>
            <p>Voici votre lien pour activer/réactiver votre accès :</p>
            <p><a href="${link ?? REDIRECT}">Activer mon compte</a></p>
            <p>Ou connectez-vous depuis : <a href="${PUBLIC_BASE_URL}/login">${PUBLIC_BASE_URL}/login</a></p>
          `,
          text: `Lien d’activation: ${link ?? REDIRECT}`
        })
      } catch { /* ignore */ }
    }

    return res.status(200).json({ ok:true, link_fallback: !!link })
  } catch (e:any) {
    return res.status(500).json({ ok:false, message: e?.message || 'Server error' })
  }
}
