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
import { initialDeliveries, initialOrders, initialProducts } from '../data/mockData'
import { generateId } from '../utils/helpers'
import type { Delivery, Order, Product, StockMovement } from '../types'

type BackendPaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded'
type BackendOrderStatus = 'processing' | 'in_transit' | 'delivered' | 'cancelled'
interface BackendOrderItem {
  productId: string
  name: string
  quantity: number
  unitPrice: number
  lineTotal: number
}
interface BackendOrder {
  id: string
  referenceNumber: string
  customerName: string
  customerPhone: string
  deliveryAddress: string
  deliveryDate: string
  items: BackendOrderItem[]
  subtotal: number
  total: number
  paidAmount: number
  paymentStatus: BackendPaymentStatus
  orderStatus: BackendOrderStatus
  refundedAmount: number
  refundReason?: string
  refundType?: 'partial' | 'full'
  createdAt: string
  updatedAt: string
}

function toFrontendPaymentStatus(status: BackendPaymentStatus): Order['paymentStatus'] {
  return status === 'unpaid' ? 'pending' : status
}

function toBackendOrderStatus(status: Order['orderStatus']): BackendOrderStatus {
  if (status === 'out_for_delivery') return 'in_transit'
  if (status === 'completed') return 'delivered'
  if (status === 'cancelled') return 'cancelled'
  return 'processing'
}

function toFrontendOrderStatus(status: BackendOrderStatus): Order['orderStatus'] {
  if (status === 'in_transit') return 'out_for_delivery'
  if (status === 'delivered') return 'completed'
  if (status === 'cancelled') return 'cancelled'
  return 'packed'
}

function toFrontendOrder(order: BackendOrder): Order {
  return {
    id: order.id,
    referenceNumber: order.referenceNumber,
    customerName: order.customerName,
    contact: order.customerPhone,
    address: order.deliveryAddress,
    items: order.items.map((item) => ({
      productId: item.productId,
      productName: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.lineTotal,
    })),
    total: order.total,
    paidAmount: order.paidAmount,
    paymentStatus: toFrontendPaymentStatus(order.paymentStatus),
    orderStatus: toFrontendOrderStatus(order.orderStatus),
    deliveryStatus: order.orderStatus === 'delivered' ? 'delivered' : order.orderStatus === 'in_transit' ? 'in_transit' : 'scheduled',
    orderType: order.deliveryAddress.toLowerCase() === 'pickup' ? 'pickup' : 'delivery',
    date: order.deliveryDate,
    createdAt: order.createdAt,
    notes: undefined,
    refundAmount: order.refundedAmount,
    refundStatus: order.refundedAmount > 0 ? 'completed' : 'none',
    refundReason: order.refundReason,
  }
}

function toBackendCreateOrder(order: Omit<Order, 'id' | 'createdAt' | 'referenceNumber'>) {
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

  // Refresh helpers
  refresh: () => Promise<void>
  refreshProducts: () => Promise<void>
  refreshOrders: () => Promise<void>
  refreshDeliveries: () => Promise<void>

  // Product mutators
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
  restockProduct: (id: string, quantity: number) => Promise<void>
  listProductMovements: (id: string) => Promise<StockMovement[]>

  // Order mutators
  addOrder: (order: Omit<Order, 'id' | 'createdAt' | 'referenceNumber'>) => Promise<void>
  updateOrder: (id: string, order: Partial<Order>) => Promise<void>
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

// Safe fetch - returns a typed empty value on failure so the page renders.
async function safeFetch<T>(path: string, fallback: T): Promise<T> {
  try {
    return await apiFetch<T>(path)
  } catch (err) {
    // TODO(backend): remove fallback once all endpoints are wired up.
    console.warn(`[api] ${path} failed, using fallback:`, err)
    return fallback
  }
}

function genRef(orders: Order[]): string {
  const year = new Date().getFullYear()
  const count = orders.length + 1
  return `SS-${year}-${String(count).padStart(5, '0')}`
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshProducts = useCallback(async () => {
    const list = await safeFetch<Product[]>('/products', initialProducts)
    setProducts(list.length >= 100 ? list : initialProducts)
  }, [])

  const refreshOrders = useCallback(async () => {
    const list = await safeFetch<BackendOrder[]>('/orders', [])
    const mappedOrders = list.map(toFrontendOrder)
    setOrders(mappedOrders.length >= 100 ? mappedOrders : initialOrders)
  }, [])

  const refreshDeliveries = useCallback(async () => {
    const list = await safeFetch<Delivery[]>('/deliveries', initialDeliveries)
    setDeliveries(list.length >= 100 ? list : initialDeliveries)
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([refreshProducts(), refreshOrders(), refreshDeliveries()])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [refreshProducts, refreshOrders, refreshDeliveries])

  useEffect(() => {
    void refresh()
  }, [refresh])

  // ── Product mutators ──────────────────────────────────────────────
  const addProduct = useCallback(
    async (product: Omit<Product, 'id'>) => {
      const tempId = generateId('PRD')
      const optimistic: Product = { ...product, id: tempId }
      setProducts((prev) => [...prev, optimistic])
      try {
        const created = await apiFetch<Product>('/products', {
          method: 'POST',
          body: JSON.stringify(product),
        })
        setProducts((prev) => prev.map((p) => (p.id === tempId ? created : p)))
      } catch (err) {
        // Roll back optimistic insert on failure.
        setProducts((prev) => prev.filter((p) => p.id !== tempId))
        throw err
      }
    },
    [],
  )

  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)))
    try {
      const updated = await apiFetch<Product>(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      })
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)))
    } catch (err) {
      await refreshProducts()
      throw err
    }
  }, [refreshProducts])

  const deleteProduct = useCallback(async (id: string) => {
    const previous = products
    setProducts((prev) => prev.filter((p) => p.id !== id))
    try {
      await apiFetch<{ ok: true }>(`/products/${id}`, { method: 'DELETE' })
    } catch (err) {
      setProducts(previous)
      throw err
    }
  }, [products, refreshProducts])

  const restockProduct = useCallback(
    async (id: string, quantity: number) => {
      const target = products.find((p) => p.id === id)
      if (!target) return
      const newStock = target.stock + quantity
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, stock: newStock } : p)))
      try {
        const result = await apiFetch<{ product: Product; movement: StockMovement }>(`/products/${id}/stock/inbound`, {
          method: 'POST',
          body: JSON.stringify({
            quantity,
            referenceNo: `RESTOCK-${Date.now()}-${id.slice(0, 8)}`,
            supplier: 'Manual restock',
          }),
        })
        setProducts((prev) => prev.map((p) => (p.id === id ? result.product : p)))
      } catch (err) {
        await refreshProducts()
        throw err
      }
    },
    [products, refreshProducts],
  )

  const listProductMovements = useCallback(async (id: string) => {
    return apiFetch<StockMovement[]>(`/products/${id}/movements`)
  }, [])

  // ── Order mutators ────────────────────────────────────────────────
  const addOrder = useCallback(
    async (order: Omit<Order, 'id' | 'createdAt' | 'referenceNumber'>) => {
      const tempId = generateId('ORD')
      const optimistic: Order = {
        ...order,
        id: tempId,
        referenceNumber: genRef(orders),
        createdAt: new Date().toISOString(),
      }
      setOrders((prev) => [...prev, optimistic])
      try {
        const created = await apiFetch<BackendOrder>('/orders', {
          method: 'POST',
          body: JSON.stringify(toBackendCreateOrder(order)),
        })
        setOrders((prev) => prev.map((o) => (o.id === tempId ? toFrontendOrder(created) : o)))
        // Inventory may have changed server-side; refresh products.
        void refreshProducts()
      } catch (err) {
        setOrders((prev) => prev.filter((o) => o.id !== tempId))
        throw err
      }
    },
    [orders, refreshProducts],
  )

  const updateOrder = useCallback(async (id: string, updates: Partial<Order>) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...updates } : o)))
    try {
      const body = toBackendUpdateOrder(updates)
      if (Object.keys(body).length === 0) return
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

  const processPayment = useCallback(
    async (orderId: string, amount: number) => {
      const target = orders.find((o) => o.id === orderId)
      if (!target) return
      const updated = await apiFetch<BackendOrder>(`/orders/${orderId}/payment`, {
        method: 'POST',
        body: JSON.stringify({ amount }),
      })
      setOrders((prev) => prev.map((o) => (o.id === orderId ? toFrontendOrder(updated) : o)))
    },
    [orders, updateOrder],
  )

  const processRefund = useCallback(
    async (orderId: string, amount: number, reason: string, type: 'full' | 'partial') => {
      const target = orders.find((o) => o.id === orderId)
      if (!target) return
      const updated = await apiFetch<BackendOrder>(`/orders/${orderId}/refund`, {
        method: 'POST',
        body: JSON.stringify({ amount, reason, type }),
      })
      setOrders((prev) => prev.map((o) => (o.id === orderId ? toFrontendOrder(updated) : o)))
    },
    [orders, updateOrder],
  )

  // ── Delivery mutators ─────────────────────────────────────────────
  const updateDeliveryStatus = useCallback(
    async (id: string, status: Delivery['status'], step: number) => {
      setDeliveries((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status, currentStep: step } : d)),
      )
      try {
        const updated = await apiFetch<Delivery>(`/deliveries/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ status, currentStep: step }),
        })
        setDeliveries((prev) => prev.map((d) => (d.id === id ? updated : d)))
      } catch (err) {
        await refreshDeliveries()
        throw err
      }
    },
    [refreshDeliveries],
  )

  const value = useMemo<DataContextValue>(
    () => ({
      products,
      orders,
      deliveries,
      loading,
      error,
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
