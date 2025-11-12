import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return res.status(500).json({ ok: false, reason: 'missing_env', have: { url: !!url, key: !!key } })

    const sb = createClient(url, key)
    // ping minimal : liste 1 tenant (si existe)
    const { data, error } = await sb.from('tenants').select('id, name').limit(1)
    if (error) return res.status(500).json({ ok: false, step: 'select', error: error.message })
    return res.status(200).json({ ok: true, env_ok: true, sample: data })
  } catch (e: any) {
    return res.status(500).json({ ok: false, err: e.message })
  }
}
