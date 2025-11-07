import { createClient } from '@supabase/supabase-js'

const URL = process.env.SUPABASE_URL!
const ANON = process.env.SUPABASE_ANON_KEY!
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok:false, message:'Method Not Allowed' })
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ ok:false, message:'Missing token' })

    const sbUser = createClient(URL, ANON, { global: { headers: { Authorization: `Bearer ${token}` } } })
    const { data: me } = await sbUser.auth.getUser()
    if (!me?.user?.id) return res.status(401).json({ ok:false, message:'Invalid session' })

    const { data: roleRow } = await sbUser.from('app_users').select('role').eq('id', me.user.id).single()
    if (roleRow?.role !== 'super_admin') return res.status(403).json({ ok:false, message:'Forbidden: super_admin only' })

    const { admin_email, tenant_id } = req.body || {}
    if (!admin_email || !tenant_id) return res.status(400).json({ ok:false, message:'admin_email and tenant_id required' })

    const sbAdmin = createClient(URL, SERVICE)

    // retrouver l'user Auth par email
    const listed = await sbAdmin.auth.admin.listUsers({ page:1, perPage:200 } as any)
    const found = listed?.data?.users?.find(u => u.email?.toLowerCase() === String(admin_email).toLowerCase())
    if (!found) return res.status(404).json({ ok:false, message:'Auth user not found' })

    const { data: up, error } = await sbAdmin
      .from('app_users')
      .upsert({ id: found.id, email: admin_email, role: 'club_admin', tenant_id }, { onConflict: 'id' })
      .select('id')
      .single()

    if (error) return res.status(400).json({ ok:false, message: error.message })
    res.status(200).json({ ok:true, app_user_id: up?.id || found.id })
  } catch (e:any) {
    res.status(500).json({ ok:false, message: e?.message || 'Server error' })
  }
}
