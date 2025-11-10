import { createBrowserRouter } from 'react-router-dom'

// Layout public minimal que tu as déjà
import PublicLayout from '@/components/layouts/PublicLayout'

// Pages publiques
import PublicHome from '@/pages'          // src/pages/index.tsx (bouton “Se connecter”)
import LoginPage from '@/pages/login'
import LogoutPage from '@/pages/logout'

// 404 simple
function NotFound() {
  return <div className="p-6">404 — Page introuvable</div>
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <PublicHome /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'logout', element: <LogoutPage /> },
    ],
  },
  { path: '*', element: <NotFound /> },
])
