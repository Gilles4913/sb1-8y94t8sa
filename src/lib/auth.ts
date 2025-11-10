import supabase from '@/lib/supabase'

export type AppRole = 'super_admin' | 'club_admin' | null

export async function getCurrentRole(): Promise<AppRole> {
  const { data } = await supabase.auth.getUser()
  const uid = data.user?.id
  if (!uid) return null
  const { data: row } = await supabase
    .from('app_users')
    .select('role')
    .eq('id', uid)
    .single()
  return (row?.role as AppRole) ?? null
}

export async function isAuthenticated(): Promise<boolean> {
  const { data } = await supabase.auth.getSession()
  return !!data.session
}
