/**
 * DataContext — replaces the Capstone's localStorage-backed AppContext.
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
import { generateId } from '../utils/helpers'
import type { Delivery, Order, Product, StockMovement } from '../types'

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

// Safe fetch — returns a typed empty value on failure so the page renders.
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
    const list = await safeFetch<Product[]>('/products', [])
    setProducts(list)
  }, [])

  const refreshOrders = useCallback(async () => {
    const list = await safeFetch<Order[]>('/orders', [])
    setOrders(list)
  }, [])

  const refreshDeliveries = useCallback(async () => {
    const list = await safeFetch<Delivery[]>('/deliveries', [])
    setDeliveries(list)
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
        const created = await apiFetch<Order>('/orders', {
          method: 'POST',
          body: JSON.stringify(order),
        })
        setOrders((prev) => prev.map((o) => (o.id === tempId ? created : o)))
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
      const updated = await apiFetch<Order>(`/orders/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      })
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)))
    } catch (err) {
      await refreshOrders()
      throw err
    }
  }, [refreshOrders])

  const processPayment = useCallback(
    async (orderId: string, amount: number) => {
      const target = orders.find((o) => o.id === orderId)
      if (!target) return
      const newPaid = target.paidAmount + amount
      const status: Order['paymentStatus'] =
        newPaid >= target.total ? 'paid' : newPaid > 0 ? 'partial' : 'pending'
      await updateOrder(orderId, { paidAmount: newPaid, paymentStatus: status })
    },
    [orders, updateOrder],
  )

  const processRefund = useCallback(
    async (orderId: string, amount: number, reason: string, type: 'full' | 'partial') => {
      const target = orders.find((o) => o.id === orderId)
      if (!target) return
      const newPaid = type === 'full' ? 0 : Math.max(0, target.paidAmount - amount)
      const status: Order['paymentStatus'] =
        newPaid === 0 ? 'refunded' : newPaid < target.total ? 'partial' : 'paid'
      await updateOrder(orderId, {
        paidAmount: newPaid,
        paymentStatus: status,
        refundAmount: target.refundAmount + amount,
        refundStatus: 'completed',
        refundReason: reason,
      })
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
