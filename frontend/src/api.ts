/**
 * API client. Vite dev server proxies /auth to the Hono backend in
 * production builds, but for now we hit the backend port directly.
 *
 * The bearer token is set via `setAuthToken` (called from AuthContext on
 * login/load) so page code can call `apiFetch` without thinking about
 * auth headers.
 *
 * Author: Kim Eduard Saludes (original), adapted for the multi-team project
 * Last touched: 2026-07-07
 */

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? 'http://localhost:3000'

// Token store. Updated via setAuthToken(). The apiFetch helper reads this
// and adds the Authorization header automatically.
let authToken: string | null = null

export function setAuthToken(token: string | null): void {
  authToken = token
}

export function getAuthToken(): string | null {
  return authToken
}

export interface ApiError extends Error {
  status: number
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  }
  if (authToken && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${authToken}`
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  })
  if (!res.ok) {
    let message = `Request failed: ${res.status}`
    try {
      const body = (await res.json()) as { error?: string }
      if (body.error) message = body.error
    } catch {
      /* ignore parse failure */
    }
    const err = new Error(message) as ApiError
    err.status = res.status
    throw err
  }
  return res.json() as Promise<T>
}
