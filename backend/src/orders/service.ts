/**
 * Orders service — validation and lifecycle business logic.
 *
 * Author: FireFlyDeveloper
 * Last touched: 2026-07-17
 */

import { sendNotificationEvent } from '../notifications/webhook.js';
import {
  applyPayment,
  applyRefund,
  cancelOrder,
  createOrder,
  findOrderById,
  findOrderByReference,
  listOrders,
  updateOrder,
  type Order,
  type OrderCreateInput,
  type OrderItemInput,
  type OrderStatus,
  type OrderUpdateInput,
  type RefundType,
} from './store.js';

type ServiceResult<T> = { ok: true; data: T } | { ok: false; status: 400 | 404 | 409; error: string };

const ORDER_STATUSES: OrderStatus[] = ['processing', 'in_transit', 'delivered', 'cancelled'];

function readString(value: unknown, field: string, required = true): ServiceResult<string | undefined> {
  if (value === undefined || value === null) {
    return required ? { ok: false, status: 400, error: `${field} is required` } : { ok: true, data: undefined };
  }
  if (typeof value !== 'string' || value.trim().length === 0) {
    return { ok: false, status: 400, error: `${field} must be a non-empty string` };
  }
  return { ok: true, data: value.trim() };
}

function readNumber(value: unknown, field: string, required = true): ServiceResult<number | undefined> {
  if (value === undefined || value === null) {
    return required ? { ok: false, status: 400, error: `${field} is required` } : { ok: true, data: undefined };
  }
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return { ok: false, status: 400, error: `${field} must be a finite number` };
  }
  return { ok: true, data: value };
}

export function parseOrderStatus(value: unknown, required = true): ServiceResult<OrderStatus | undefined> {
  const parsed = readString(value, 'orderStatus', required);
  if (!parsed.ok || parsed.data === undefined) return parsed as ServiceResult<OrderStatus | undefined>;
  if (!ORDER_STATUSES.includes(parsed.data as OrderStatus)) {
    return { ok: false, status: 400, error: 'orderStatus must be processing, in_transit, delivered, or cancelled' };
  }
  return { ok: true, data: parsed.data as OrderStatus };
}

function parseDeliveryDate(value: unknown, required = true): ServiceResult<string | undefined> {
  const parsed = readString(value, 'deliveryDate', required);
  if (!parsed.ok || parsed.data === undefined) return parsed;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(parsed.data) || Number.isNaN(Date.parse(parsed.data + 'T00:00:00Z'))) {
    return { ok: false, status: 400, error: 'deliveryDate must be YYYY-MM-DD' };
  }
  return parsed;
}

function parseItems(value: unknown): ServiceResult<OrderItemInput[]> {
  if (!Array.isArray(value) || value.length === 0) {
    return { ok: false, status: 400, error: 'items must be a non-empty array' };
  }

  const items: OrderItemInput[] = [];
  for (const [index, raw] of value.entries()) {
    if (typeof raw !== 'object' || raw === null) return { ok: false, status: 400, error: `items[${index}] must be an object` };
    const input = raw as Record<string, unknown>;
    const productId = readString(input.productId, `items[${index}].productId`);
    if (!productId.ok || productId.data === undefined) return productId as ServiceResult<OrderItemInput[]>;
    const name = readString(input.name, `items[${index}].name`);
    if (!name.ok || name.data === undefined) return name as ServiceResult<OrderItemInput[]>;
    const quantity = readNumber(input.quantity, `items[${index}].quantity`);
    if (!quantity.ok || quantity.data === undefined) return quantity as ServiceResult<OrderItemInput[]>;
    if (!Number.isInteger(quantity.data) || quantity.data <= 0) {
      return { ok: false, status: 400, error: `items[${index}].quantity must be a positive integer` };
    }
    const unitPrice = readNumber(input.unitPrice, `items[${index}].unitPrice`);
    if (!unitPrice.ok || unitPrice.data === undefined) return unitPrice as ServiceResult<OrderItemInput[]>;
    if (unitPrice.data < 0) return { ok: false, status: 400, error: `items[${index}].unitPrice must be non-negative` };
    items.push({ productId: productId.data, name: name.data, quantity: quantity.data, unitPrice: unitPrice.data });
  }
  return { ok: true, data: items };
}

function parseCreate(body: unknown): ServiceResult<OrderCreateInput> {
  if (typeof body !== 'object' || body === null) return { ok: false, status: 400, error: 'invalid body' };
  const input = body as Record<string, unknown>;
  const customerName = readString(input.customerName, 'customerName');
  if (!customerName.ok || customerName.data === undefined) return customerName as ServiceResult<OrderCreateInput>;
  const customerPhone = readString(input.customerPhone, 'customerPhone');
  if (!customerPhone.ok || customerPhone.data === undefined) return customerPhone as ServiceResult<OrderCreateInput>;
  const deliveryAddress = readString(input.deliveryAddress, 'deliveryAddress');
  if (!deliveryAddress.ok || deliveryAddress.data === undefined) return deliveryAddress as ServiceResult<OrderCreateInput>;
  const deliveryDate = parseDeliveryDate(input.deliveryDate);
  if (!deliveryDate.ok || deliveryDate.data === undefined) return deliveryDate as ServiceResult<OrderCreateInput>;
  const items = parseItems(input.items);
  if (!items.ok) return items as ServiceResult<OrderCreateInput>;
  const paidAmount = readNumber(input.paidAmount, 'paidAmount', false);
  if (!paidAmount.ok) return paidAmount as ServiceResult<OrderCreateInput>;
  if (paidAmount.data !== undefined && paidAmount.data < 0) return { ok: false, status: 400, error: 'paidAmount must be non-negative' };
  const referenceNumber = readString(input.referenceNumber, 'referenceNumber', false);
  if (!referenceNumber.ok) return referenceNumber as ServiceResult<OrderCreateInput>;

  return {
    ok: true,
    data: {
      referenceNumber: referenceNumber.data,
      customerName: customerName.data,
      customerPhone: customerPhone.data,
      deliveryAddress: deliveryAddress.data,
      deliveryDate: deliveryDate.data,
      items: items.data,
      paidAmount: paidAmount.data,
    },
  };
}

function parseUpdate(body: unknown): ServiceResult<OrderUpdateInput> {
  if (typeof body !== 'object' || body === null) return { ok: false, status: 400, error: 'invalid body' };
  const input = body as Record<string, unknown>;
  const data: OrderUpdateInput = {};
  for (const field of ['customerName', 'customerPhone', 'deliveryAddress'] as const) {
    if (field in input) {
      const parsed = readString(input[field], field, false);
      if (!parsed.ok) return parsed;
      data[field] = parsed.data;
    }
  }
  if ('deliveryDate' in input) {
    const parsed = parseDeliveryDate(input.deliveryDate, false);
    if (!parsed.ok) return parsed;
    data.deliveryDate = parsed.data;
  }
  if ('orderStatus' in input) {
    const parsed = parseOrderStatus(input.orderStatus, false);
    if (!parsed.ok) return parsed;
    data.orderStatus = parsed.data;
  }
  if (Object.keys(data).length === 0) return { ok: false, status: 400, error: 'no fields to update' };
  return { ok: true, data };
}

export function listOrderRecords(): Order[] {
  return listOrders();
}

export function getOrderRecord(id: string): ServiceResult<Order> {
  const order = findOrderById(id);
  if (!order) return { ok: false, status: 404, error: 'order not found' };
  return { ok: true, data: order };
}

export function getOrderByReferenceRecord(referenceNumber: string): ServiceResult<Order> {
  const order = findOrderByReference(referenceNumber);
  if (!order) return { ok: false, status: 404, error: 'order not found' };
  return { ok: true, data: order };
}

export function addOrderRecord(body: unknown): ServiceResult<Order> {
  const parsed = parseCreate(body);
  if (!parsed.ok) return parsed;
  try {
    return { ok: true, data: createOrder(parsed.data) };
  } catch (error) {
    return { ok: false, status: 409, error: error instanceof Error ? error.message : 'could not create order' };
  }
}

export function editOrderRecord(id: string, body: unknown): ServiceResult<Order> {
  const parsed = parseUpdate(body);
  if (!parsed.ok) return parsed;
  const current = findOrderById(id);
  if (!current) return { ok: false, status: 404, error: 'order not found' };
  const order = updateOrder(id, parsed.data);
  if (!order) return { ok: false, status: 404, error: 'order not found' };
  if (parsed.data.orderStatus !== undefined && current.orderStatus !== order.orderStatus) {
    void sendNotificationEvent({
      type: 'order.status_changed',
      occurredAt: new Date().toISOString(),
      data: {
        orderId: order.id,
        referenceNumber: order.referenceNumber,
        previousStatus: current.orderStatus,
        status: order.orderStatus,
      },
    }).catch((error) => {
      const message = error instanceof Error ? error.message : 'unknown notification error';
      console.warn(`[notifications] order status event failed: ${message}`);
    });
  }
  return { ok: true, data: order };
}

export function cancelOrderRecord(id: string): ServiceResult<{ ok: true; order: Order }> {
  const order = cancelOrder(id);
  if (!order) return { ok: false, status: 404, error: 'order not found' };
  return { ok: true, data: { ok: true, order } };
}

export function processPayment(orderId: string, body: unknown): ServiceResult<Order> {
  if (typeof body !== 'object' || body === null) return { ok: false, status: 400, error: 'invalid body' };
  const amount = readNumber((body as Record<string, unknown>).amount, 'amount');
  if (!amount.ok || amount.data === undefined) return amount as ServiceResult<Order>;
  if (amount.data <= 0) return { ok: false, status: 400, error: 'amount must be greater than zero' };
  const current = findOrderById(orderId);
  if (!current) return { ok: false, status: 404, error: 'order not found' };
  if (current.paidAmount + amount.data > current.total) return { ok: false, status: 400, error: 'payment exceeds order total' };
  const order = applyPayment(orderId, amount.data);
  if (!order) return { ok: false, status: 404, error: 'order not found' };
  return { ok: true, data: order };
}

export function processRefund(orderId: string, body: unknown): ServiceResult<Order> {
  if (typeof body !== 'object' || body === null) return { ok: false, status: 400, error: 'invalid body' };
  const input = body as Record<string, unknown>;
  const amount = readNumber(input.amount, 'amount');
  if (!amount.ok || amount.data === undefined) return amount as ServiceResult<Order>;
  if (amount.data <= 0) return { ok: false, status: 400, error: 'amount must be greater than zero' };
  const reason = readString(input.reason, 'reason');
  if (!reason.ok || reason.data === undefined) return reason as ServiceResult<Order>;
  const type = readString(input.type, 'type');
  if (!type.ok || type.data === undefined) return type as ServiceResult<Order>;
  if (type.data !== 'partial' && type.data !== 'full') return { ok: false, status: 400, error: 'type must be partial or full' };
  const current = findOrderById(orderId);
  if (!current) return { ok: false, status: 404, error: 'order not found' };
  if (amount.data > current.paidAmount) return { ok: false, status: 400, error: 'refund exceeds paid amount' };
  const order = applyRefund(orderId, amount.data, reason.data, type.data as RefundType);
  if (!order) return { ok: false, status: 404, error: 'order not found' };
  return { ok: true, data: order };
}
