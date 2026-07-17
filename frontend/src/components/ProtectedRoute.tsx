/**
 * ProtectedRoute — redirects to /login if there's no token in the auth
 * context. Optionally gates routes by user role.
 *
 * Last touched: 2026-07-17
 */

import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth, type Role } from './AuthContext'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: Role[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { token, user } = useAuth()
  const location = useLocation()

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (allowedRoles && (!user || !allowedRoles.includes(user.role))) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-amber-700">Unauthorized</p>
          <h1 className="mt-3 text-2xl font-bold text-gray-900">Access restricted</h1>
          <p className="mt-2 text-sm text-gray-600">
            Your account role does not have permission to view this SmartStock page.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
