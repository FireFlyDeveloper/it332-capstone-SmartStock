import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './components/AuthContext'
import { DataProvider } from './components/DataContext'
import { LoginPage } from './pages/LoginPage'
import { Dashboard } from './pages/Dashboard'
import { Inventory } from './pages/Inventory'
import { Orders } from './pages/Orders'
import { DeliveryPage as Delivery } from './pages/Delivery'
import TrackingPage from './pages/Tracking'
import { Analytics } from './pages/Analytics'
import { Reports } from './pages/Reports'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import './App.css'
/*
 * App — SmartStock frontend root.
 * Demo-only build: AuthBootstrap skips /auth/me validation. Any stored auth
 * in localStorage is trusted at face value so the demo works with no backend.
 * Production would call /auth/me here via apiFetch.
 *
 * Team: Kim Eduard Saludes (infra/shell), Luraine Villaranda (features),
 *       Hazel (auth/visual story)
 * Last touched: 2026-07-07 (round 2 — demo polish, pure-frontend auth)
 */

function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const { token } = useAuth()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Demo-only: no /auth/me validation. If a token exists in localStorage
    // (set by a prior LoginForm login), trust it. If not, we're logged out.
    // Production would call apiFetch<{user:User}>('/auth/me') here.
    setReady(true)
  }, [token])

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="font-mono text-xs uppercase tracking-[0.22em] text-gray-500">
          Loading SmartStock...
        </div>
      </div>
    )
  }
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DataProvider>
              <Layout>
                <Dashboard />
              </Layout>
            </DataProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventory"
        element={
          <ProtectedRoute>
            <DataProvider>
              <Layout>
                <Inventory />
              </Layout>
            </DataProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute>
            <DataProvider>
              <Layout>
                <Orders />
              </Layout>
            </DataProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/delivery"
        element={
          <ProtectedRoute>
            <DataProvider>
              <Layout>
                <Delivery />
              </Layout>
            </DataProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tracking"
        element={
          <DataProvider>
            <TrackingPage />
          </DataProvider>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <DataProvider>
              <Layout>
                <Analytics />
              </Layout>
            </DataProvider>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <DataProvider>
              <Layout>
                <Reports />
              </Layout>
            </DataProvider>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AuthBootstrap>
          <AppRoutes />
        </AuthBootstrap>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
