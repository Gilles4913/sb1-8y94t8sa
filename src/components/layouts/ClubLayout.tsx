import { Outlet } from 'react-router-dom'
import TopNav from '@/components/layouts/TopNav'
import ImpersonationBar from '@/components/admin/ImpersonationBar'
import ClubSubnav from '@/components/layouts/ClubSubnav'

export default function ClubLayout() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-zinc-950 dark:text-gray-100">
      <TopNav />
      <ImpersonationBar />
      <ClubSubnav />
      <main className="mx-auto w-full max-w-6xl p-4">
        <Outlet />
      </main>
    </div>
  )
}
