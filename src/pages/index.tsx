import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
)

export default function PublicHome() {
  const nav = useNavigate()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    (async () => {
      const { data: me } = await supabase.auth.getUser()
      if (!me.user) { setChecking(false); return }
      const { data, error } = await supabase
        .from('app_users')
        .select('role')
        .eq('id', me.user.id)
        .single()
      if (!error) {
        if (data?.role === 'super_admin') nav('/admin', { replace: true })
        else nav('/clubs', { replace: true })
        return
      }
      setChecking(false)
    })()
  }, [nav])

  if (checking) return <div className="p-6">Chargement…</div>

  return (
    <div className="mx-auto mt-10 w-full max-w-3xl">
      <h1 className="mb-2 text-2xl font-semibold">Bienvenue 👋</h1>
      <p className="text-gray-600">
        Connectez-vous pour accéder à votre tableau de bord.
      </p>
      <div className="mt-4">
        <Link to="/login" className="rounded-md bg-gray-900 px-3 py-2 text-sm text-white hover:bg-black">
          Se connecter
        </Link>
      </div>
    </div>
  )
}
