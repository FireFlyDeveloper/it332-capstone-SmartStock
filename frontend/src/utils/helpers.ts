/**
 * Pure helpers copied from the Capstone frontend. No backend dependency.
 * Some localStorage/state-management helpers were dropped because we now
 * fetch from the Hono backend.
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

// Format date
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Get status color
export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    // Product status
    active: 'bg-green-100 text-green-800',
    discontinued: 'bg-gray-100 text-gray-800',
    // Stock status
    healthy: 'bg-green-100 text-green-800',
    low: 'bg-yellow-100 text-yellow-800',
    critical: 'bg-red-100 text-red-800',
    out_of_stock: 'bg-gray-100 text-gray-800',
    // Order status
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    packed: 'bg-purple-100 text-purple-800',
    out_for_delivery: 'bg-orange-100 text-orange-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    ready_for_pickup: 'bg-blue-100 text-blue-800',
    // Payment status
    paid: 'bg-green-100 text-green-800',
    partial: 'bg-orange-100 text-orange-800',
    refunded: 'bg-red-100 text-red-800',
    // Delivery status
    not_required: 'bg-gray-100 text-gray-800',
    scheduled: 'bg-blue-100 text-blue-800',
    in_transit: 'bg-orange-100 text-orange-800',
    delivered: 'bg-green-100 text-green-800',
    // Delivery detail status
    assigned: 'bg-blue-100 text-blue-800',
    picked_up: 'bg-purple-100 text-purple-800',
    arrived: 'bg-orange-100 text-orange-800',
    failed: 'bg-red-100 text-red-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
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
