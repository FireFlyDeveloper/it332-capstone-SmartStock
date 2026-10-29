/**
 * DataContext - replaces the Capstone's localStorage-backed AppContext.
 * Holds products / orders / deliveries, fetches them from the Hono backend
 * via apiFetch, and exposes mutators that hit the appropriate endpoints
 * before updating local state.
 *
 * Pages should call useData() to read or mutate domain data.
 *
 * Last touched: 2026-07-07
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
import { apiFetch } from '../api'
import type { Delivery, Order, Product, StockMovement } from '../types'
import { toFrontendOrder, type BackendOrder, type BackendOrderStatus } from './orderMapper'

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

interface DataContextValue {
  // Data
  products: Product[]
  orders: Order[]
  deliveries: Delivery[]
  loading: boolean
  error: string | null
  productsLoading: boolean
  productsError: string | null
  ordersLoading: boolean
  ordersError: string | null
  deliveriesLoading: boolean
  deliveriesError: string | null

  // Refresh helpers
  refresh: () => Promise<void>
  refreshProducts: () => Promise<void>
  refreshOrders: () => Promise<void>
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

  // Delivery mutators
  updateDeliveryStatus: (id: string, status: Delivery['status'], step: number) => Promise<void>
}

const DataContext = createContext<DataContextValue | null>(null)

async function safeFetch<T>(path: string): Promise<T> {
  return apiFetch<T>(path)
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [productsLoading, setProductsLoading] = useState(true)
  const [productsError, setProductsError] = useState<string | null>(null)
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [ordersError, setOrdersError] = useState<string | null>(null)
  const [deliveriesLoading, setDeliveriesLoading] = useState(true)
  const [deliveriesError, setDeliveriesError] = useState<string | null>(null)

  const refreshProducts = useCallback(async () => {
    setProductsLoading(true)
    setProductsError(null)
    try {
      setProducts(await safeFetch<Product[]>('/products'))
    } catch (err) {
      setProductsError(err instanceof Error ? err.message : 'Failed to load products')
      throw err
    } finally {
      setProductsLoading(false)
    }
  }, [])

  const refreshOrders = useCallback(async () => {
    setOrdersLoading(true)
    setOrdersError(null)
    try {
      const list = await safeFetch<BackendOrder[]>('/orders')
      setOrders(list.map(toFrontendOrder))
    } catch (err) {
      setOrdersError(err instanceof Error ? err.message : 'Failed to load orders')
      throw err
    } finally {
      setOrdersLoading(false)
    }
  }, [])

  const refreshDeliveries = useCallback(async () => {
    setDeliveriesLoading(true)
    setDeliveriesError(null)
    try {
      setDeliveries(await safeFetch<Delivery[]>('/deliveries'))
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
    const results = await Promise.allSettled([refreshProducts(), refreshOrders(), refreshDeliveries()])
    const messages = results.flatMap((result, index) => {
      if (result.status !== 'rejected') return []
      const resource = ['Products', 'Orders', 'Deliveries'][index]
      const reason = result.reason
      return [`${resource}: ${reason instanceof Error ? reason.message : 'Failed to load data'}`]
    })
    setError(messages.length ? messages.join('; ') : null)
    setLoading(false)
  }, [refreshProducts, refreshOrders, refreshDeliveries])

  useEffect(() => {
    void refresh()
  }, [refresh])

  // ── Product mutators ──────────────────────────────────────────────
  const addProduct = useCallback(
    async (product: Omit<Product, 'id'>) => {
      try {
        const created = await apiFetch<Product>('/products', {
          method: 'POST',
          body: JSON.stringify(product),
        })
        setProducts((prev) => [...prev, created])
      } catch (err) {
        await refreshProducts().catch(() => undefined)
        throw err
      }
    },
    [refreshProducts],
  )

  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    try {
      const updated = await apiFetch<Product>(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      })
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)))
    } catch (err) {
      await refreshProducts().catch(() => undefined)
      throw err
    }
  }, [refreshProducts])

  const deleteProduct = useCallback(async (id: string) => {
    try {
      await apiFetch<{ ok: true }>(`/products/${id}`, { method: 'DELETE' })
      setProducts((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      await refreshProducts().catch(() => undefined)
      throw err
    }
  }, [refreshProducts])

  const restockProduct = useCallback(
    async (id: string, quantity: number, details: { referenceNo: string; supplier: string; unitCost?: number }) => {
      try {
        const result = await apiFetch<{ product: Product; movement: StockMovement }>(`/products/${id}/stock/inbound`, {
          method: 'POST',
          body: JSON.stringify({ quantity, ...details }),
        })
        setProducts((prev) => prev.map((p) => (p.id === id ? result.product : p)))
      } catch (err) {
        await refreshProducts().catch(() => undefined)
        throw err
      }
    },
    [refreshProducts],
  )

  const listProductMovements = useCallback(async (id: string) => {
    return apiFetch<StockMovement[]>(`/products/${id}/movements`)
  }, [])

  // ── Order mutators ────────────────────────────────────────────────
  const addOrder = useCallback(
    async (order: Omit<Order, 'id' | 'createdAt' | 'referenceNumber' | 'paymentStatus'>) => {
      const created = await apiFetch<BackendOrder>('/orders', {
        method: 'POST',
        body: JSON.stringify(toBackendCreateOrder(order)),
      })
      setOrders((prev) => [...prev, toFrontendOrder(created)])
      // Inventory may have changed server-side; refresh products.
      void refreshProducts()
    },
    [refreshProducts],
  )

  const updateOrder = useCallback(async (id: string, updates: Partial<Order>) => {
    const body = toBackendUpdateOrder(updates)
    if (Object.keys(body).length === 0) {
      throw new Error('No supported order fields were provided.')
    }
    try {
      const updated = await apiFetch<BackendOrder>(`/orders/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      })
      setOrders((prev) => prev.map((o) => (o.id === id ? toFrontendOrder(updated) : o)))
    } catch (err) {
      await refreshOrders()
      throw err
    }
  }, [refreshOrders])

  const cancelOrder = useCallback(async (id: string) => {
    const result = await apiFetch<{ ok: true; order: BackendOrder }>(`/orders/${id}/cancel`, { method: 'POST' })
    const updated = result.order
    setOrders((prev) => prev.map((order) => order.id === id ? toFrontendOrder(updated) : order))
    await Promise.all([refreshProducts(), refreshOrders()])
  }, [refreshOrders, refreshProducts])

  const processPayment = useCallback(
    async (orderId: string, amount: number) => {
      const updated = await apiFetch<BackendOrder>(`/orders/${orderId}/payment`, {
        method: 'POST',
        body: JSON.stringify({ amount }),
      })
      const authoritativeOrder = toFrontendOrder(updated)
      setOrders((prev) => prev.some((o) => o.id === orderId)
        ? prev.map((o) => (o.id === orderId ? authoritativeOrder : o))
        : [...prev, authoritativeOrder])
    },
    [],
  )

  const processRefund = useCallback(
    async (orderId: string, amount: number, reason: string, type: 'full' | 'partial') => {
      const updated = await apiFetch<BackendOrder>(`/orders/${orderId}/refund`, {
        method: 'POST',
        body: JSON.stringify({ amount, reason, type }),
      })
      const authoritativeOrder = toFrontendOrder(updated)
      setOrders((prev) => prev.some((o) => o.id === orderId)
        ? prev.map((o) => (o.id === orderId ? authoritativeOrder : o))
        : [...prev, authoritativeOrder])
    },
    [],
  )

  // ── Delivery mutators ─────────────────────────────────────────────
  const updateDeliveryStatus = useCallback(
    async (id: string, status: Delivery['status'], _step: number) => {
      const delivery = deliveries.find((item) => item.id === id);
      const orderId = delivery?.orderId ?? id;
      const orderStatus = status === 'pending'
        ? 'pending'
        : status === 'in_transit'
          ? 'out_for_delivery'
          : status === 'delivered'
            ? 'completed'
            : null;
      if (!orderStatus) throw new Error('Only pending, in-transit, and delivered order statuses are supported.');
      try {
        await updateOrder(orderId, { orderStatus });
        await refreshDeliveries();
      } catch (err) {
        await refreshDeliveries().catch(() => undefined);
        throw err
      }
    },
    [deliveries, refreshDeliveries, updateOrder],
  )

  const value = useMemo<DataContextValue>(
    () => ({
      products,
      orders,
      deliveries,
      loading,
      error,
      productsLoading,
      productsError,
      ordersLoading,
      ordersError,
      deliveriesLoading,
      deliveriesError,
      refresh,
      refreshProducts,
      refreshOrders,
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
      updateDeliveryStatus,
    }),
    [
      products,
      orders,
      deliveries,
      loading,
      error,
      productsLoading,
      productsError,
      ordersLoading,
      ordersError,
      deliveriesLoading,
      deliveriesError,
      refresh,
      refreshProducts,
      refreshOrders,
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
      updateDeliveryStatus,
    ],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
