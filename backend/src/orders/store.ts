/**
 * Orders in-memory store — order lifecycle records.
 *
 * Author: FireFlyDeveloper
 * Last touched: 2026-07-17
 */

import { randomUUID } from 'node:crypto';

export type OrderStatus = 'processing' | 'in_transit' | 'delivered' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded';
export type RefundType = 'partial' | 'full';

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  id: string;
  referenceNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryDate: string;
  items: OrderItem[];
  subtotal: number;
  total: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  refundedAmount: number;
  refundReason?: string;
  refundType?: RefundType;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemInput {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderCreateInput {
  referenceNumber?: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryDate: string;
  items: OrderItemInput[];
  paidAmount?: number;
}

export interface OrderUpdateInput {
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  deliveryDate?: string;
  orderStatus?: OrderStatus;
}

const orders = new Map<string, Order>();
let referenceSequence = 1;

function paymentStatusFor(total: number, paidAmount: number): PaymentStatus {
  if (paidAmount <= 0) return 'unpaid';
  if (paidAmount >= total) return 'paid';
  return 'partial';
}

export function generateReferenceNumber(): string {
  const year = new Date().getUTCFullYear();
  let reference = '';
  do {
    reference = `SS-${year}-${String(referenceSequence).padStart(5, '0')}`;
    referenceSequence += 1;
  } while (findOrderByReference(reference));
  return reference;
}

function normalizeItems(items: OrderItemInput[]): OrderItem[] {
  return items.map((item) => ({
    productId: item.productId.trim(),
    name: item.name.trim(),
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: item.quantity * item.unitPrice,
  }));
}

export function listOrders(): Order[] {
  return [...orders.values()].sort((a, b) => a.referenceNumber.localeCompare(b.referenceNumber));
}

export function findOrderById(id: string): Order | null {
  return orders.get(id) ?? null;
}

export function findOrderByReference(referenceNumber: string): Order | null {
  const normalized = referenceNumber.trim().toUpperCase();
  return listOrders().find((order) => order.referenceNumber === normalized) ?? null;
}

export function createOrder(input: OrderCreateInput): Order {
  const referenceNumber = input.referenceNumber?.trim().toUpperCase() || generateReferenceNumber();
  if (findOrderByReference(referenceNumber)) throw new Error('reference number already exists');

  const items = normalizeItems(input.items);
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const total = subtotal;
  const paidAmount = input.paidAmount ?? 0;
  const now = new Date().toISOString();
  const order: Order = {
    id: randomUUID(),
    referenceNumber,
    customerName: input.customerName.trim(),
    customerPhone: input.customerPhone.trim(),
    deliveryAddress: input.deliveryAddress.trim(),
    deliveryDate: input.deliveryDate,
    items,
    subtotal,
    total,
    paidAmount,
    paymentStatus: paymentStatusFor(total, paidAmount),
    orderStatus: 'processing',
    refundedAmount: 0,
    createdAt: now,
    updatedAt: now,
  };
  orders.set(order.id, order);
  return order;
}

export function updateOrder(id: string, input: OrderUpdateInput): Order | null {
  const current = orders.get(id);
  if (!current) return null;
  const next: Order = {
    ...current,
    customerName: input.customerName === undefined ? current.customerName : input.customerName.trim(),
    customerPhone: input.customerPhone === undefined ? current.customerPhone : input.customerPhone.trim(),
    deliveryAddress: input.deliveryAddress === undefined ? current.deliveryAddress : input.deliveryAddress.trim(),
    deliveryDate: input.deliveryDate ?? current.deliveryDate,
    orderStatus: input.orderStatus ?? current.orderStatus,
    updatedAt: new Date().toISOString(),
  };
  orders.set(id, next);
  return next;
}

export function cancelOrder(id: string): Order | null {
  return updateOrder(id, { orderStatus: 'cancelled' });
}

export function applyPayment(id: string, amount: number): Order | null {
  const current = orders.get(id);
  if (!current) return null;
  const paidAmount = Math.min(current.total, current.paidAmount + amount);
  const next: Order = {
    ...current,
    paidAmount,
    paymentStatus: paymentStatusFor(current.total, paidAmount),
    updatedAt: new Date().toISOString(),
  };
  orders.set(id, next);
  return next;
}

export function applyRefund(id: string, amount: number, reason: string, type: RefundType): Order | null {
  const current = orders.get(id);
  if (!current) return null;
  const paidAmount = Math.max(0, current.paidAmount - amount);
  const refundedAmount = current.refundedAmount + amount;
  const next: Order = {
    ...current,
    paidAmount,
    refundedAmount,
    refundReason: reason.trim(),
    refundType: type,
    paymentStatus: paidAmount === 0 ? 'refunded' : paymentStatusFor(current.total, paidAmount),
    updatedAt: new Date().toISOString(),
  };
  orders.set(id, next);
  return next;
}

export function _resetOrderStore(seed = true): void {
  orders.clear();
  referenceSequence = 1;
  if (!seed) return;

  createOrder({
    referenceNumber: 'SS-2026-00001',
    customerName: 'Ana Cruz',
    customerPhone: '+639171110000',
    deliveryAddress: '101 Market Street, Manila',
    deliveryDate: '2026-08-01',
    paidAmount: 0,
    items: [{ productId: 'PRD-001', name: 'Glass Sheet', quantity: 3, unitPrice: 800 }],
  });
  createOrder({
    referenceNumber: 'SS-2026-00002',
    customerName: 'Ben Reyes',
    customerPhone: '+639172220000',
    deliveryAddress: '202 Warehouse Road, Quezon City',
    deliveryDate: '2026-08-05',
    paidAmount: 2500,
    items: [{ productId: 'PRD-002', name: 'Aluminum Frame', quantity: 2, unitPrice: 1250 }],
  });
}

_resetOrderStore();
