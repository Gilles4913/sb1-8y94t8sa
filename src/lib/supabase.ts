import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL!
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY!

/**
 * Singleton Supabase client
 * - storageKey dédié à ton app pour éviter les collisions
 * - persistSession/autoRefresh activés
 */
export const supabase = createClient(url, anon, {
  auth: {
    storageKey: 'sb-sponsor-auth',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export default supabase
