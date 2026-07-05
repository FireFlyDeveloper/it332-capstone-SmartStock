import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth, type User } from './components/AuthContext'
import { setAuthToken } from './api'
import { DataProvider } from './components/DataContext'
import { apiFetch } from './api'
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

function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const { token, setAuth } = useAuth()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (!token) {
      setAuthToken(null)
      setReady(true)
      return
    }
    setAuthToken(token)
    apiFetch<{ user: User }>('/auth/me')
      .then((res) => {
        if (cancelled) return
        setAuth({ token, user: res.user })
      })
      .catch(() => {
        if (cancelled) return
        setAuth({ user: null, token: null })
        setAuthToken(null)
      })
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [token, setAuth])

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
          <ProtectedRoute>
            <DataProvider>
              <Layout>
                <TrackingPage />
              </Layout>
            </DataProvider>
          </ProtectedRoute>
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
