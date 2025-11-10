import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/router'
import { TenantProvider } from '@/contexts/TenantContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <TenantProvider>
        <RouterProvider router={router} />
      </TenantProvider>
    </ThemeProvider>
  </React.StrictMode>
)
