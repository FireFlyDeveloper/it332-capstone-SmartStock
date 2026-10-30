/**
 * DataContext owns compact delivery summary state and API-backed mutations;
 * full product/order records are fetched by the paged views that consume them.
 * Writes persist to the backend and refresh notification state.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { apiFetch, getDeliveriesPage } from '../api'
import type { Order, Product, StockMovement } from '../types'
import { type BackendOrder, type BackendOrderStatus } from './orderMapper'

function toBackendOrderStatus(status: Order['orderStatus']): BackendOrderStatus {
  if (status === 'out_for_delivery') return 'in_transit'
  if (status === 'completed') return 'delivered'
  if (status === 'cancelled') return 'cancelled'
  return 'processing'
}

function toBackendCreateOrder(order: Omit<Order, 'id' | 'createdAt' | 'referenceNumber' | 'paymentStatus'>) {
  return {
    customerName: order.customerName,
    customerPhone: order.contact,
    deliveryAddress: order.address || 'Pickup',
    deliveryDate: order.date || new Date().toISOString().split('T')[0],
    paidAmount: order.paidAmount,
    items: order.items.map((item) => ({
      productId: item.productId,
      name: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    })),
  }
}

function toBackendUpdateOrder(updates: Partial<Order>) {
  const body: Record<string, unknown> = {}
  if (updates.customerName !== undefined) body.customerName = updates.customerName
  if (updates.contact !== undefined) body.customerPhone = updates.contact
  if (updates.address !== undefined) body.deliveryAddress = updates.address || 'Pickup'
  if (updates.date !== undefined) body.deliveryDate = updates.date
  if (updates.orderStatus !== undefined) body.orderStatus = toBackendOrderStatus(updates.orderStatus)
  return body
}

function dispatchNotificationFeedRefresh(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('smartstock-notifications-refresh'))
}

interface DataContextValue {
  deliverySummary: { totalCount: number; pendingCount: number; inTransitCount: number; deliveredCount: number }
  loading: boolean
  error: string | null
  deliveriesLoading: boolean
  deliveriesError: string | null

  // Refresh helpers
  refresh: () => Promise<void>
  refreshDeliveries: () => Promise<void>

  // Product mutators
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
  restockProduct: (id: string, quantity: number, details: { referenceNo: string; supplier: string; unitCost?: number }) => Promise<void>
  listProductMovements: (id: string) => Promise<StockMovement[]>

  // Order mutators
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'referenceNumber' | 'paymentStatus'>) => Promise<void>
  updateOrder: (id: string, order: Partial<Order>) => Promise<void>
  cancelOrder: (id: string) => Promise<void>
  processPayment: (orderId: string, amount: number) => Promise<void>
  processRefund: (
    orderId: string,
    amount: number,
    reason: string,
    type: 'full' | 'partial',
  ) => Promise<void>

}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [deliverySummary, setDeliverySummary] = useState({ totalCount: 0, pendingCount: 0, inTransitCount: 0, deliveredCount: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deliveriesLoading, setDeliveriesLoading] = useState(true)
  const [deliveriesError, setDeliveriesError] = useState<string | null>(null)

  const refreshDeliveries = useCallback(async () => {
    setDeliveriesLoading(true)
    setDeliveriesError(null)
    try {
      const result = await getDeliveriesPage({ limit: 1 })
      setDeliverySummary(result.summary)
    } catch (err) {
      setDeliveriesError(err instanceof Error ? err.message : 'Failed to load deliveries')
      throw err
    } finally {
      setDeliveriesLoading(false)
    }
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await refreshDeliveries()
    } catch (err) {
      setError(`Deliveries: ${err instanceof Error ? err.message : 'Failed to load data'}`)
    } finally {
      setLoading(false)
    }
  }, [refreshDeliveries]);

  useEffect(() => {
    void refresh()
  }, [refresh])

  // ── Product mutators ──────────────────────────────────────────────
  const addProduct = useCallback(async (product: Omit<Product, 'id'>) => {
    await apiFetch<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    })
    dispatchNotificationFeedRefresh()
  }, [])

  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    await apiFetch<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
    dispatchNotificationFeedRefresh()
  }, [])

  const deleteProduct = useCallback(async (id: string) => {
    await apiFetch<{ ok: true }>(`/products/${id}`, { method: 'DELETE' })
    dispatchNotificationFeedRefresh()
  }, [])

  const restockProduct = useCallback(async (id: string, quantity: number, details: { referenceNo: string; supplier: string; unitCost?: number }) => {
    await apiFetch<{ product: Product; movement: StockMovement }>(`/products/${id}/stock/inbound`, {
      method: 'POST',
      body: JSON.stringify({ quantity, ...details }),
    })
    dispatchNotificationFeedRefresh()
  }, [])

  const listProductMovements = useCallback(async (id: string) => {
    return apiFetch<StockMovement[]>(`/products/${id}/movements`)
  }, [])

  // ── Order mutators ────────────────────────────────────────────────
  const addOrder = useCallback(
    async (order: Omit<Order, 'id' | 'createdAt' | 'referenceNumber' | 'paymentStatus'>) => {
      await apiFetch<BackendOrder>('/orders', {
        method: 'POST',
        body: JSON.stringify(toBackendCreateOrder(order)),
      })
      dispatchNotificationFeedRefresh()
    },
    [],
  )

  const updateOrder = useCallback(async (id: string, updates: Partial<Order>) => {
    const body = toBackendUpdateOrder(updates)
    if (Object.keys(body).length === 0) {
      throw new Error('No supported order fields were provided.')
    }
    await apiFetch<BackendOrder>(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
    dispatchNotificationFeedRefresh()
  }, [])

  const cancelOrder = useCallback(async (id: string) => {
    await apiFetch<{ ok: true; order: BackendOrder }>(`/orders/${id}/cancel`, { method: 'POST' })
    dispatchNotificationFeedRefresh()
  }, [])

  const processPayment = useCallback(async (orderId: string, amount: number) => {
    await apiFetch<BackendOrder>(`/orders/${orderId}/payment`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    })
    dispatchNotificationFeedRefresh()
  }, [])

  const processRefund = useCallback(async (orderId: string, amount: number, reason: string, type: 'full' | 'partial') => {
    await apiFetch<BackendOrder>(`/orders/${orderId}/refund`, {
      method: 'POST',
      body: JSON.stringify({ amount, reason, type }),
    })
    dispatchNotificationFeedRefresh()
  }, [])

  const value = useMemo<DataContextValue>(
    () => ({
      deliverySummary,
      loading,
      error,
      deliveriesLoading,
      deliveriesError,
      refresh,
      refreshDeliveries,
      addProduct,
      updateProduct,
      deleteProduct,
      restockProduct,
      listProductMovements,
      addOrder,
      updateOrder,
      cancelOrder,
      processPayment,
      processRefund,
    }),
    [
      deliverySummary,
      loading,
      error,
      deliveriesLoading,
      deliveriesError,
      refresh,
      refreshDeliveries,
      addProduct,
      updateProduct,
      deleteProduct,
      restockProduct,
      listProductMovements,
      addOrder,
      updateOrder,
      cancelOrder,
      processPayment,
      processRefund,
    ],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
