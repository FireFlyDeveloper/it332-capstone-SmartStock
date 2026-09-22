/**
 * Tracking privacy helpers — public-safe order masking.
 *
 * Author: FireFlyDeveloper
 * Last touched: 2026-07-17
 */

import type { Order } from '../orders/store.js';

export interface PublicTrackingOrder {
  referenceNumber: string;
  customerName: string;
  deliveryAddress: string;
  deliveryDate: string;
  orderStatus: Order['orderStatus'];
  paymentStatus: Order['paymentStatus'];
  total: number;
  paidAmount: number;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
}

export function maskCustomerName(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part, index) => (index === 0 ? part : `${part.charAt(0).toUpperCase()}.`))
    .join(' ');
}

export function summarizeAddress(address: string): string {
  const parts = address
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length <= 2) return parts.join(', ');
  return parts.slice(-2).join(', ');
}

export function toPublicTrackingOrder(order: Order): PublicTrackingOrder {
  return {
    referenceNumber: order.referenceNumber,
    customerName: maskCustomerName(order.customerName),
    deliveryAddress: summarizeAddress(order.deliveryAddress),
    deliveryDate: order.deliveryDate,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    total: order.total,
    paidAmount: order.paidAmount,
    items: order.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
    })),
  };
}
