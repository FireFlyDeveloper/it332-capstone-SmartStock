/**
 * Pure helpers copied from the Capstone frontend. No backend dependency.
 * Some localStorage/state-management helpers were dropped because we now
 * fetch from the Hono backend.
 *
 * Last touched: 2026-07-07
 */

import type { Product } from '../types'

// Generate a client-side ID for optimistic UI. The backend reassigns real IDs.
export const generateId = (prefix: string): string => {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 6)
  return `${prefix}-${timestamp}-${random}`.toUpperCase()
}

// Format currency (PHP)
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount)
}

// Format currency without decimal cents (clean for KPI cards)
export const formatCurrencyWhole = (amount: number): string => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount)
}

// Format date
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Get status color matching Soft Professional theme (Emerald, Amber, Rose, Indigo, Blue)
export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    // Product status
    active: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    discontinued: 'bg-slate-100 text-slate-700 border border-slate-200/60',
    // Stock status
    healthy: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    low: 'bg-amber-50 text-amber-700 border border-amber-200/60',
    critical: 'bg-rose-50 text-rose-700 border border-rose-200/60',
    out_of_stock: 'bg-slate-100 text-slate-700 border border-slate-200/60',
    // Order status
    pending: 'bg-amber-50 text-amber-700 border border-amber-200/60',
    confirmed: 'bg-blue-50 text-blue-700 border border-blue-200/60',
    packed: 'bg-indigo-50 text-indigo-700 border border-indigo-200/60',
    out_for_delivery: 'bg-amber-50 text-amber-700 border border-amber-200/60',
    completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    cancelled: 'bg-rose-50 text-rose-700 border border-rose-200/60',
    ready_for_pickup: 'bg-blue-50 text-blue-700 border border-blue-200/60',
    // Payment status
    paid: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    partial: 'bg-amber-50 text-amber-700 border border-amber-200/60',
    refunded: 'bg-rose-50 text-rose-700 border border-rose-200/60',
    // Delivery status
    not_required: 'bg-slate-100 text-slate-700 border border-slate-200/60',
    scheduled: 'bg-blue-50 text-blue-700 border border-blue-200/60',
    in_transit: 'bg-amber-50 text-amber-700 border border-amber-200/60',
    delivered: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    // Delivery detail status
    assigned: 'bg-blue-50 text-blue-700 border border-blue-200/60',
    picked_up: 'bg-indigo-50 text-indigo-700 border border-indigo-200/60',
    arrived: 'bg-amber-50 text-amber-700 border border-amber-200/60',
    failed: 'bg-rose-50 text-rose-700 border border-rose-200/60',
  }
  return colors[status] || 'bg-slate-100 text-slate-700 border border-slate-200/60'
}

// Check stock status
export const checkStockStatus = (stock: number, threshold: number): string => {
  if (stock <= 0) return 'out_of_stock'
  if (stock <= threshold * 0.5) return 'critical'
  if (stock <= threshold) return 'low'
  return 'healthy'
}

// Re-export Product type to keep old imports working
export type { Product }

// Format Date object to YYYY-MM-DD for native date inputs
export const formatDateInput = (date: Date): string => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
