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

import type { BackendOrder } from './components/orderMapper'
import type { Delivery, Product } from './types'

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
  page: {
    limit: number
    totalCount: number
    hasMore: boolean
    nextCursor: string | null
  }
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
export interface NotificationFeedItem {
  id: string
  type: 'stock' | 'order' | 'delivery'
  severity: 'critical' | 'warning' | 'info' | 'success'
  title: string
  message: string
  contextLabel: string
  link: string
}

export function getNotificationFeed(): Promise<NotificationFeedItem[]> {
  return apiFetch<NotificationFeedItem[]>('/notifications')
}

export interface AnalyticsOrderSummary {
  totalOrderCount: number
  averageOrderValue: number
  topSellingItems: Array<{ productId: string; name: string; quantity: number; category: string }>
  mostOrderedItems: Array<{ name: string; category: string; stock: number; unitsOrdered: number; status: string }>
  leastOrderedItems: Array<{ name: string; category: string; stock: number; unitsOrdered: number; status: string }>
  orderedQuantities: Record<string, number>
  salesTrendData: Array<{ month: string; sales: number; orders: number }>
}

export function getAnalyticsOrderSummary(options: { fromDate?: string | null; toDate?: string | null } = {}): Promise<AnalyticsOrderSummary> {
  const params = new URLSearchParams()
  if (options.fromDate) params.set('fromDate', options.fromDate)
  if (options.toDate) params.set('toDate', options.toDate)
  const query = params.toString()
  return apiFetch<AnalyticsOrderSummary>(`/analytics/orders/summary${query ? `?${query}` : ''}`)
}

export interface DashboardOrderSummary {
  activeOrderCount: number
  orderStatusCounts: Array<{ status: string; count: number }>
  topItems: Array<{
    productId: string
    name: string
    category: Product['category'] | null
    unit: string | null
    quantity: number
  }>
}

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

export function getDashboardOrderSummary(): Promise<DashboardOrderSummary> {
  return apiFetch<DashboardOrderSummary>('/analytics/dashboard-order-summary')
}

export function getAnalyticsSalesTrends(range?: DashboardSalesRange): Promise<AnalyticsSalesTrend[]> {
  const query = range ? `?range=${encodeURIComponent(range)}` : ''
  return apiFetch<AnalyticsSalesTrend[]>(`/analytics/sales-trends${query}`)
}

export function getDashboardRecentActivity(limit = 6): Promise<DashboardActivityRecord[]> {
  return apiFetch<DashboardActivityRecord[]>(`/analytics/recent-activity?limit=${encodeURIComponent(String(limit))}`)
}

export interface ReportOrdersSummary {
  totalOrders: number
  totalSales: number
  completedCount: number
  pendingOrders: number
  statusCounts: { completed: number; inProgress: number; pending: number; cancelled: number }
  paymentCounts: { paid: number; pending: number; partial: number; refunded: number }
}

export function getReportOrdersSummary(options: { fromDate?: string | null; toDate?: string | null } = {}): Promise<ReportOrdersSummary> {
  const params = new URLSearchParams()
  if (options.fromDate) params.set('fromDate', options.fromDate)
  if (options.toDate) params.set('toDate', options.toDate)
  const query = params.toString()
  return apiFetch<ReportOrdersSummary>(`/reports/orders/summary${query ? `?${query}` : ''}`)
}

export interface PurchaseAnalyticsPageResponse extends PurchaseAnalyticsResponse {
  page: { limit: number; totalCount: number; hasMore: boolean; nextCursor: string | null }
}

export function getAnalyticsPurchasesPage(options: { year?: number; limit?: number; cursor?: string | null } = {}): Promise<PurchaseAnalyticsPageResponse> {
  const params = new URLSearchParams()
  if (options.year !== undefined) params.set('year', String(options.year))
  if (options.limit !== undefined) params.set('limit', String(options.limit))
  if (options.cursor) params.set('cursor', options.cursor)
  return apiFetch<PurchaseAnalyticsPageResponse>(`/analytics/purchases/page?${params.toString()}`)
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

export interface DemandForecastPageResponse extends DemandForecastResponse {
  page: { limit: number; totalCount: number; hasMore: boolean; nextCursor: string | null }
}

export function getDemandForecastPage(options: { historyMonths?: number; limit?: number; cursor?: string | null } = {}): Promise<DemandForecastPageResponse> {
  const params = new URLSearchParams({ historyMonths: String(options.historyMonths ?? 12) })
  if (options.limit !== undefined) params.set('limit', String(options.limit))
  if (options.cursor) params.set('cursor', options.cursor)
  return apiFetch<DemandForecastPageResponse>(`/analytics/demand-forecast/page?${params.toString()}`)
}

export interface PolicyPerformancePageResponse extends PolicyPerformanceResponse {
  page: { limit: number; totalCount: number; hasMore: boolean; nextCursor: string | null }
}

export function getPolicyPerformancePage(options: { limit?: number; cursor?: string | null } = {}): Promise<PolicyPerformancePageResponse> {
  const params = new URLSearchParams()
  if (options.limit !== undefined) params.set('limit', String(options.limit))
  if (options.cursor) params.set('cursor', options.cursor)
  const query = params.toString()
  return apiFetch<PolicyPerformancePageResponse>(`/reports/policy-performance/page${query ? `?${query}` : ''}`)
}

export function getPolicyPerformance(): Promise<PolicyPerformanceResponse> {
  return apiFetch<PolicyPerformanceResponse>('/reports/policy-performance')
}

export interface ManagedStaffPage {
  staff: ManagedStaff[]
  page: { limit: number; totalCount: number; hasMore: boolean; nextCursor: string | null }
}

export function getStaffPage(options: { limit?: number; cursor?: string | null } = {}): Promise<ManagedStaffPage> {
  const params = new URLSearchParams()
  if (options.limit !== undefined) params.set('limit', String(options.limit))
  if (options.cursor) params.set('cursor', options.cursor)
  const search = params.toString()
  const query = search ? `?${search}` : ''
  return apiFetch<ManagedStaffPage>(`/auth/staff${query}`)
}
export async function createStaff(input: { email: string; name: string; password: string }): Promise<ManagedStaff> {
  return (await apiFetch<{ staff: ManagedStaff }>('/auth/staff', { method: 'POST', body: JSON.stringify(input) })).staff
}
export async function updateStaff(id: string, input: { email?: string; name?: string; password?: string }): Promise<ManagedStaff> {
  return (await apiFetch<{ staff: ManagedStaff }>(`/auth/staff/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(input) })).staff
}
export function deleteStaff(id: string): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/auth/staff/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export interface DailySalesPageOptions {
  limit?: number
  cursor?: string | null
  status?: 'all' | DailySalesOrder['orderStatus']
  search?: string
}

export interface OrdersPageOptions {
  limit?: number
  cursor?: string | null
  status?: 'all' | 'pending' | 'ready_for_pickup' | 'packed' | 'out_for_delivery' | 'completed' | 'cancelled'
  search?: string
  fromDate?: string | null
  toDate?: string | null
}

export interface OrdersPageResponse {
  orders: BackendOrder[]
  page: { limit: number; totalCount: number; hasMore: boolean; nextCursor: string | null }
  summary: { pendingCount: number; inProgressCount: number; completedCount: number }
}

export function getOrdersPage(options: OrdersPageOptions = {}): Promise<OrdersPageResponse> {
  const params = new URLSearchParams()
  if (options.limit !== undefined) params.set('limit', String(options.limit))
  if (options.cursor) params.set('cursor', options.cursor)
  if (options.status) params.set('status', options.status)
  if (options.search?.trim()) params.set('search', options.search.trim())
  if (options.fromDate) params.set('from', options.fromDate)
  if (options.toDate) params.set('to', options.toDate)
  return apiFetch<OrdersPageResponse>(`/orders/page?${params.toString()}`)
}

export interface DeliveryPageItem extends Delivery {
  customerName: string
  customerPhone: string
  referenceNumber: string
  createdAt: string
}

export interface DeliveriesPageResponse {
  items: DeliveryPageItem[]
  page: { limit: number; totalCount: number; hasMore: boolean; nextCursor: string | null }
  summary: { totalCount: number; pendingCount: number; inTransitCount: number; deliveredCount: number }
}

export function getDeliveriesPage(options: {
  limit?: number
  cursor?: string | null
  status?: 'all' | 'pending' | 'in_transit' | 'delivered'
} = {}): Promise<DeliveriesPageResponse> {
  const params = new URLSearchParams()
  if (options.limit !== undefined) params.set('limit', String(options.limit))
  if (options.cursor) params.set('cursor', options.cursor)
  if (options.status) params.set('status', options.status)
  return apiFetch<DeliveriesPageResponse>(`/deliveries?${params.toString()}&mode=page`)
}

export interface ProductsPageResponse {
  items: Product[]
  page: { limit: number; totalCount: number; hasMore: boolean; nextCursor: string | null }
  summary: { totalProducts: number; glassCount: number; aluminumCount: number; lowStockCount: number; outOfStockCount: number }
}

export function getProductsPage(options: {
  limit?: number
  cursor?: string | null
  category?: 'all' | 'glass' | 'aluminum'
  stock?: 'all' | 'low' | 'healthy'
  search?: string
} = {}): Promise<ProductsPageResponse> {
  const params = new URLSearchParams({ mode: 'page' })
  if (options.limit !== undefined) params.set('limit', String(options.limit))
  if (options.cursor) params.set('cursor', options.cursor)
  if (options.category) params.set('category', options.category)
  if (options.stock) params.set('stock', options.stock)
  if (options.search?.trim()) params.set('q', options.search.trim())
  return apiFetch<ProductsPageResponse>(`/products?${params.toString()}`)
}

export function getDailySales(date: string, options: DailySalesPageOptions = {}): Promise<DailySalesSummary> {
  const params = new URLSearchParams({ date });
  if (options.limit !== undefined) params.set('limit', String(options.limit));
  if (options.cursor) params.set('cursor', options.cursor);
  if (options.status) params.set('status', options.status);
  if (options.search?.trim()) params.set('q', options.search.trim());
  return apiFetch<DailySalesSummary>(`/daily-sales?${params.toString()}`)
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
