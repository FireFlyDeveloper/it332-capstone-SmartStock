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

export interface ApiFetchInit extends RequestInit {
  auth?: boolean
}

function buildAuthHeaders(initHeaders: HeadersInit | undefined, includeJson: boolean): Record<string, string> {
  const headers: Record<string, string> = {
    ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
    ...(initHeaders as Record<string, string> | undefined),
  }
  if (authToken && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${authToken}`
  }
  return headers
}

async function raiseApiError(res: Response): Promise<never> {
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

export async function apiFetch<T>(path: string, init: ApiFetchInit = {}): Promise<T> {
  const { auth = true, ...requestInit } = init
  const headers = auth
    ? buildAuthHeaders(requestInit.headers, true)
    : { 'Content-Type': 'application/json', ...(requestInit.headers as Record<string, string> | undefined) }

  const res = await fetch(`${API_BASE}${path}`, {
    ...requestInit,
    headers,
  })
  if (!res.ok) await raiseApiError(res)
  return res.json() as Promise<T>
}

export async function apiFetchBlob(path: string, init: ApiFetchInit = {}): Promise<Response> {
  const { auth = true, ...requestInit } = init
  const headers = auth ? buildAuthHeaders(requestInit.headers, false) : requestInit.headers
  const res = await fetch(`${API_BASE}${path}`, {
    ...requestInit,
    headers,
  })
  if (!res.ok) await raiseApiError(res)
  return res
}

export interface AnalyticsSalesTrend {
  month: string
  transactionCount: number
  grossSales: number
}

export interface AnalyticsPurchaseMetric {
  materialType: string
  supplier: string
  transactionCount: number
  totalQuantity: number
  totalCost: number
}

export interface AnalyticsMovementMetric {
  month: string
  quantity: number
  classification: 'fast_moving' | 'slow_moving'
}

export interface AnalyticsForecastResponse {
  alpha: number
  forecast: number
}

export interface AnalyticsInsightsResponse {
  summary: string
  recommendations: string[]
  risks: string[]
  confidence: 'low' | 'medium' | 'high'
  source: 'deepseek' | 'fallback'
}

export function getAnalyticsSalesTrends(): Promise<AnalyticsSalesTrend[]> {
  return apiFetch<AnalyticsSalesTrend[]>('/analytics/sales-trends')
}

export function getAnalyticsPurchases(year: number): Promise<AnalyticsPurchaseMetric[]> {
  return apiFetch<AnalyticsPurchaseMetric[]>(`/analytics/purchases?year=${encodeURIComponent(String(year))}`)
}

export function getAnalyticsMovement(threshold: number): Promise<AnalyticsMovementMetric[]> {
  return apiFetch<AnalyticsMovementMetric[]>(`/analytics/movement?threshold=${encodeURIComponent(String(threshold))}`)
}

export function getAnalyticsForecast(quantities: number[], alpha = 0.35): Promise<AnalyticsForecastResponse> {
  return apiFetch<AnalyticsForecastResponse>('/analytics/forecast', {
    method: 'POST',
    body: JSON.stringify({ quantities, alpha }),
  })
}

export function getAnalyticsInsights(year: number, threshold: number): Promise<AnalyticsInsightsResponse> {
  return apiFetch<AnalyticsInsightsResponse>(
    `/analytics/insights?year=${encodeURIComponent(String(year))}&threshold=${encodeURIComponent(String(threshold))}`,
  )
}
