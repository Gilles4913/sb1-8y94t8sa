import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '@/lib/supabase'
import { useTenant } from '@/contexts/TenantContext'

interface Club {
  id: string
  name: string
  email_contact: string
}

export default function AdminClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(false)
  const { setTenant } = useTenant()
  const nav = useNavigate()

  useEffect(() => {
    async function loadClubs() {
      setLoading(true)
      const { data, error } = await supabase.from('tenants').select('id, name, email_contact')
      if (error) console.error(error)
      else setClubs(data)
      setLoading(false)
    }
    loadClubs()
  }, [])

  const switchToClub = (club: Club) => {
    setTenant({ id: club.id, name: club.name })
    nav('/clubs')
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Clubs</h1>

      {loading ? (
        <p>Chargement…</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-3 py-2 text-left">Nom</th>
              <th className="border px-3 py-2 text-left">Email contact</th>
              <th className="border px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clubs.map((club) => (
              <tr key={club.id} className="hover:bg-gray-50">
                <td className="border px-3 py-2">{club.name}</td>
                <td className="border px-3 py-2">{club.email_contact}</td>
                <td className="border px-3 py-2 text-center">
                  <button
                    onClick={() => switchToClub(club)}
                    className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700"
                  >
                    Basculer sur ce club
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
