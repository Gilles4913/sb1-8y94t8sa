import { createBrowserRouter } from 'react-router-dom'
import PublicLayout from '@/components/layouts/PublicLayout'
import LoginPage from '@/pages/login'
import LogoutPage from '@/pages/logout'

function Home() { return <div className="p-6">Bienvenue — veuillez vous connecter.</div> }
function NotFound() { return <div className="p-6">404 — Page introuvable</div> }

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'logout', element: <LogoutPage /> },
    ],
  },
  { path: '*', element: <NotFound /> },
])
