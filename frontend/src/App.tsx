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
 * App - SmartStock frontend root.
 * Stored auth is validated against /auth/me before protected routes render.
 *
 * Team: Kim Eduard Saludes (infra/shell), Luraine Villaranda (features),
 *       Hazel (auth/visual story)
 * Last touched: 2026-07-17 (production auth validation)
 */

function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const { token, validateSession } = useAuth()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      setReady(false)
      if (token) {
        await validateSession()
      }
      if (!cancelled) setReady(true)
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [token, validateSession])

  if (!ready) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-surface-2">
        <div className="font-mono text-xs uppercase tracking-[0.22em] text-text-muted">
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
          <ProtectedRoute allowedRoles={['admin', 'staff']}>
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
          <ProtectedRoute allowedRoles={['admin', 'staff']}>
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
