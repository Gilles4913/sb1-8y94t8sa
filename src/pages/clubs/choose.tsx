import { useNavigate } from 'react-router-dom'
import SelectTenantModal from '@/components/admin/SelectTenantModal'

export default function ChooseClubPage() {
  const nav = useNavigate()
  return (
    <div className="p-6">
      {/* On affiche la modale immédiatement ; en fermant, on revient à /admin */}
      <SelectTenantModal onClose={() => nav('/admin', { replace: true })} />
    </div>
  )
}
