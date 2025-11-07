import { Outlet } from 'react-router-dom'
import TopNav from '@/components/layouts/TopNav'
import ImpersonationBar from '@/components/admin/ImpersonationBar'

export default function ClubLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <TopNav />
      <ImpersonationBar />
      <main className="mx-auto w-full max-w-6xl p-4">
        <Outlet />
      </main>
    </div>
  )
}
