/**
 * LoginPage - composes AuthLayout with LoginForm + AuthArtPanel.
 *
 * Author: Kim Eduard Saludes
 * Last touched: 2026-07-07
 */

import { Navigate, useLocation } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { LoginForm } from '../components/LoginForm'
import { AuthArtPanel } from '../components/AuthArtPanel'
import { useAuth } from '../components/AuthContext'
import { getPostLoginPath } from '../utils/postLoginPath'

export function LoginPage() {
  const { token, user } = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname

  if (token) {
    return <Navigate to={getPostLoginPath(from, user?.role ?? null)} replace />
  }

  return (
    <AuthLayout
      form={<LoginForm />}
      art={<AuthArtPanel />}
    />
  )
}
