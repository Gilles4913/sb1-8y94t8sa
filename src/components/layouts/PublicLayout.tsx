import { Outlet } from 'react-router-dom'

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-zinc-950 dark:text-gray-100">
      <main className="mx-auto w-full max-w-6xl p-4">
        <Outlet />
      </main>
    </div>
  )
}
