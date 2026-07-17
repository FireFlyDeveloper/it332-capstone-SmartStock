/**
 * Auth context — holds the current user + token, exposes login/logout.
 *
 * Author: Kim Eduard Saludes
 * Last touched: 2026-07-17
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { getMe, logoutRequest, setAuthToken } from '../api'

export type Role = 'admin' | 'staff'

export interface User {
  id: string
  email: string
  name: string
  role: Role
}

export interface AuthState {
  user: User | null
  token: string | null
}

interface AuthContextValue extends AuthState {
  login: (token: string, user: User) => void
  logout: () => void
  setAuth: (state: AuthState) => void
  validateSession: () => Promise<boolean>
  isAdmin: boolean
  isStaff: boolean
  canExportReports: boolean
  canViewAnalytics: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_KEY = 'smartstock.auth'

function readStored(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { user: null, token: null }
    const parsed = JSON.parse(raw) as AuthState
    if (parsed && typeof parsed === 'object' && typeof parsed.token === 'string') {
      setAuthToken(parsed.token)
      return { token: parsed.token, user: parsed.user ?? null }
    }
  } catch {
    /* ignore */
  }
  setAuthToken(null)
  return { user: null, token: null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(readStored)

  const setAuth = useCallback((next: AuthState) => {
    setAuthToken(next.token)
    setState(next)
    if (next.token && next.user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const login = useCallback(
    (token: string, user: User) => setAuth({ token, user }),
    [setAuth],
  )

  const logout = useCallback(() => {
    const hadToken = Boolean(state.token)
    setAuth({ user: null, token: null })
    if (hadToken) {
      void logoutRequest().catch(() => {
        /* best effort */
      })
    }
  }, [setAuth, state.token])

  const validateSession = useCallback(async () => {
    if (!state.token) {
      setAuth({ user: null, token: null })
      return false
    }
    setAuthToken(state.token)
    try {
      const { user } = await getMe()
      setAuth({ token: state.token, user })
      return true
    } catch {
      setAuth({ user: null, token: null })
      return false
    }
  }, [setAuth, state.token])

  const isAdmin = state.user?.role === 'admin'
  const isStaff = state.user?.role === 'staff'
  const canExportReports = isAdmin
  const canViewAnalytics = isAdmin || isStaff

  return (
    <AuthContext.Provider
      value={{ ...state, login, logout, setAuth, validateSession, isAdmin, isStaff, canExportReports, canViewAnalytics }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
