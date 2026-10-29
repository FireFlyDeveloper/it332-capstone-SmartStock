/**
 * API client. Defaults to same-origin requests so the Vite dev proxy can
 * forward API calls to the Hono backend without browser CORS failures.
 *
 * The bearer token is set via `setAuthToken` (called from AuthContext on
 * login/load) so page code can call `apiFetch` without thinking about
 * auth headers.
 *
 * Author: Kim Eduard Saludes (original), adapted for the multi-team project
 * Last touched: 2026-07-17
 */

const API_BASE = ((import.meta.env.VITE_API_BASE as string | undefined)?.trim().replace(/\/+$/, '')) ?? ''

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

export type ApiRole = 'admin' | 'staff'

export interface ApiUser {
  id: string
  email: string
  name: string
  role: ApiRole
  createdAt?: string
}

export interface ManagedStaff {
  id: string
  email: string
  name: string
  role: 'staff'
  createdAt: string
}

export interface DailySalesOrder {
  id: string
  referenceNumber: string
  customerName: string
  items: { productId: string; name: string; quantity: number; unitPrice: number; lineTotal: number }[]
  total: number
  paidAmount: number
  refundedAmount: number
  paymentStatus: 'unpaid' | 'partial' | 'paid' | 'refunded'
  orderStatus: 'processing' | 'in_transit' | 'delivered' | 'cancelled'
  createdAt: string
}

export interface DailySalesSummary {
  date: string
  orderCount: number
  cancelledOrderCount: number
  grossSales: number
  collectedAmount: number
  refundsAmount: number
  netCollectedAmount: number
  orders: DailySalesOrder[]
}

export interface DemandForecastProduct {
  productId: string; sku: string; name: string; category: string; unit: string; currentStock: number; reorderPoint: number;
  history: { month: string; quantity: number }[]; positiveMonths: number; forecastQuantity: number | null;
  status: 'available' | 'insufficient_history'; stockCoverageDays: number | null; recommendedOrderQuantity: number | null;
  policyAssessment: 'below_reorder_point' | 'below_forecast' | 'adequate' | 'insufficient_history'
}
export interface DemandForecastResponse {
  method: 'simple_exponential_smoothing'; alpha: number; horizonMonths: number; minimumPositiveMonths: number; generatedAt: string;
  products: DemandForecastProduct[]; summary: Record<string, number>
}

export interface PurchaseAnalyticsResponse {
  year: number; totalSpend: number; pricedReceiptCount: number; unpricedReceiptCount: number; unpricedQuantity: number;
  groups: { materialType: string; supplier: string; transactionCount: number; totalQuantity: number; totalCost: number; unpricedReceiptCount: number; unpricedQuantity: number }[]
}

export interface PolicyPerformanceProduct {
  productId: string
  sku: string
  name: string
  unit: string
  currentStock: number
  currentReorderPoint: number
  trackingStartedAt: string | null
  trackingDays: number
  timeWeightedAverageOnHand: number | null
  daysAtOrBelowReorderPoint: number
  percentTimeAtOrBelowReorderPoint: number | null
  outOfStockDays: number
  reorderPointChanges: number
  status: 'at_or_below_reorder_point' | 'above_reorder_point'
}

export interface PolicyPerformanceResponse {
  generatedAt: string
  trackingStart: string | null
  method: string
  assumption: string
  totals: {
    products: number
    productsWithHistory: number
    trackingDays: number
    outOfStockProductCount: number
    reorderPointChanges: number
  }
  rows: PolicyPerformanceProduct[]
}

export interface LoginResponse {
  token: string
  user: ApiUser
}

export interface MeResponse {
  user: ApiUser
}

export function loginRequest(email: string, password: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ email, password }),
  })
}

export function getMe(): Promise<MeResponse> {
  return apiFetch<MeResponse>('/auth/me')
}

export async function logoutRequest(): Promise<void> {
  await apiFetch<{ ok: boolean }>('/auth/logout', { method: 'POST' })
}

export interface AnalyticsSalesTrend {
  month: string
  transactionCount: number
  grossSales: number
}

export type DashboardSalesRange = '6M' | '1Y' | 'ALL'
export interface DashboardActivityRecord {
  id: string
  kind: 'order_recorded' | 'stock_movement'
  occurredAt: string
  referenceNumber: string
  orderStatus?: string
  customerName?: string
  orderTotal?: number
  movementType?: 'inbound' | 'outbound'
  productId?: string
  productName?: string
  unit?: string
  quantity?: number
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

export function getAnalyticsSalesTrends(range?: DashboardSalesRange): Promise<AnalyticsSalesTrend[]> {
  const query = range ? `?range=${encodeURIComponent(range)}` : ''
  return apiFetch<AnalyticsSalesTrend[]>(`/analytics/sales-trends${query}`)
}

export function getDashboardRecentActivity(limit = 6): Promise<DashboardActivityRecord[]> {
  return apiFetch<DashboardActivityRecord[]>(`/analytics/recent-activity?limit=${encodeURIComponent(String(limit))}`)
}

export async function getAnalyticsPurchases(year: number): Promise<PurchaseAnalyticsResponse> {
  const groups = await apiFetch<PurchaseAnalyticsResponse['groups']>(`/analytics/purchases?year=${encodeURIComponent(String(year))}`)
  return { year, groups, totalSpend: groups.reduce((sum, row) => sum + row.totalCost, 0),
    unpricedReceiptCount: groups.reduce((sum, row) => sum + row.unpricedReceiptCount, 0),
    unpricedQuantity: groups.reduce((sum, row) => sum + row.unpricedQuantity, 0),
    pricedReceiptCount: groups.reduce((sum, row) => sum + row.transactionCount - row.unpricedReceiptCount, 0) }
}

export function getDemandForecast(historyMonths = 12): Promise<DemandForecastResponse> {
  return apiFetch<DemandForecastResponse>(`/analytics/demand-forecast?historyMonths=${encodeURIComponent(String(historyMonths))}`)
}

export function getPolicyPerformance(): Promise<PolicyPerformanceResponse> {
  return apiFetch<PolicyPerformanceResponse>('/reports/policy-performance')
}

export async function getStaff(): Promise<ManagedStaff[]> { return (await apiFetch<{ staff: ManagedStaff[] }>('/auth/staff')).staff }
export async function createStaff(input: { email: string; name: string; password: string }): Promise<ManagedStaff> {
  return (await apiFetch<{ staff: ManagedStaff }>('/auth/staff', { method: 'POST', body: JSON.stringify(input) })).staff
}
export async function updateStaff(id: string, input: { email?: string; name?: string; password?: string }): Promise<ManagedStaff> {
  return (await apiFetch<{ staff: ManagedStaff }>(`/auth/staff/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(input) })).staff
}
export function deleteStaff(id: string): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/auth/staff/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export function getDailySales(date: string): Promise<DailySalesSummary> {
  return apiFetch<DailySalesSummary>(`/daily-sales?date=${encodeURIComponent(date)}`)
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
