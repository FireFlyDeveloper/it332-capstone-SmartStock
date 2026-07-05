/**
 * Auth context — holds the current user + token, exposes login/logout.
 *
 * Author: Kim Eduard Saludes
 * Last touched: 2026-07-07
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

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
}

const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_KEY = 'smartstock.auth'

function readStored(): AuthState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { user: null, token: null }
    const parsed = JSON.parse(raw) as AuthState
    if (parsed && typeof parsed === 'object') return parsed
  } catch {
    /* ignore */
  }
  return { user: null, token: null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(readStored)

  const setAuth = useCallback((next: AuthState) => {
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

  const logout = useCallback(() => setAuth({ user: null, token: null }), [setAuth])

  return (
    <AuthContext.Provider value={{ ...state, login, logout, setAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
