// api/admin/resend-invite.ts
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const URL = process.env.SUPABASE_URL!
const ANON = process.env.SUPABASE_ANON_KEY!
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!
const RESEND = process.env.RESEND_API_KEY!
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || 'https://sponsor.a2display.fr'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok:false, message:'Method Not Allowed' })

  try {
    // 1) AuthN appelant (super_admin requis)
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ ok:false, message:'Missing token' })

    const sbUser = createClient(URL, ANON, { global: { headers: { Authorization: `Bearer ${token}` } } })
    const { data: me } = await sbUser.auth.getUser()
    if (!me?.user?.id) return res.status(401).json({ ok:false, message:'Invalid session' })

    const { data: myRole } = await sbUser.from('app_users').select('role').eq('id', me.user.id).single()
    if (myRole?.role !== 'super_admin') return res.status(403).json({ ok:false, message:'Forbidden: super_admin only' })

    // 2) Paramètres
    const { admin_email, tenant_id } = req.body || {}
    if (!admin_email) return res.status(400).json({ ok:false, message:'admin_email required' })

    const sbAdmin = createClient(URL, SERVICE)

    // 3) Retrouver l'utilisateur auth par email
    const listed = await sbAdmin.auth.admin.listUsers({ page: 1, perPage: 200 } as any)
    const user = listed?.data?.users?.find(u => u.email?.toLowerCase() === String(admin_email).toLowerCase())

    // 4) Générer un lien d’activation/récupération (première connexion)
    //    inviteUserByEmail peut ne pas être dispo selon version => fallback generateLink('recovery')
    let link: string | null = null
    if (sbAdmin.auth.admin.inviteUserByEmail) {
      const invited = await sbAdmin.auth.admin.inviteUserByEmail(admin_email)
      if (invited?.error) {
        const gl = await sbAdmin.auth.admin.generateLink({ type: 'recovery', email: admin_email })
        if (gl.error) return res.status(400).json({ ok:false, message: gl.error.message })
        link = gl.data?.action_link || null
      }
    } else {
      const gl = await sbAdmin.auth.admin.generateLink({ type: 'recovery', email: admin_email })
      if (gl.error) return res.status(400).json({ ok:false, message: gl.error.message })
      link = gl.data?.action_link || null
    }

    // 5) Envoyer un mail Resend (facultatif mais UX ++)
    if (RESEND) {
      try {
        const resend = new Resend(RESEND)
        await resend.emails.send({
          from: 'noreply@notifications.a2display.fr',
          to: admin_email,
          subject: 'Votre accès administrateur — lien d’activation',
          html: `
            <p>Bonjour,</p>
            <p>Voici votre lien pour activer (ou réactiver) votre accès administrateur&nbsp;:</p>
            <p><a href="${link ?? `${PUBLIC_BASE_URL}/login`}">Activer mon compte</a></p>
            ${tenant_id ? `<p>Club concerné : ${tenant_id}</p>` : ''}
            <p>En cas de difficulté, vous pouvez aussi vous connecter ici : <a href="${PUBLIC_BASE_URL}/login">${PUBLIC_BASE_URL}/login</a></p>
          `,
          text: `Lien d’activation: ${link ?? `${PUBLIC_BASE_URL}/login`}`,
          reply_to: 'contact@a2display.fr'
        })
      } catch (e) {
        // Non bloquant
      }
    }

    return res.status(200).json({ ok: true, user_id: user?.id ?? null, link_sent: !!RESEND, link_fallback: link ? true : false })
  } catch (e:any) {
    return res.status(500).json({ ok:false, message: e?.message || 'Server error' })
  }
}
