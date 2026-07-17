/**
 * Notification event types — serializable SmartStock events for n8n webhooks.
 *
 * Author: Hermes Agent
 * Last touched: 2026-07-17
 */

import type { DeliveryStatusFlow } from '../delivery/store.js';
import type { OrderStatus } from '../orders/store.js';

export type NotificationEventType = 'inventory.low_stock' | 'delivery.status_changed' | 'order.status_changed';

interface NotificationEventBase<TType extends NotificationEventType, TData extends Record<string, unknown>> {
  type: TType;
  occurredAt: string;
  data: TData;
}

export type InventoryLowStockEvent = NotificationEventBase<
  'inventory.low_stock',
  {
    productId: string;
    sku: string;
    name: string;
    stock: number;
    threshold: number;
    movementId: string;
    movementType: 'inbound' | 'outbound';
  }
>;

export type OrderStatusChangedEvent = NotificationEventBase<
  'order.status_changed',
  {
    orderId: string;
    referenceNumber: string;
    previousStatus: OrderStatus;
    status: OrderStatus;
  }
>;

export type DeliveryStatusChangedEvent = NotificationEventBase<
  'delivery.status_changed',
  {
    deliveryId: string;
    orderId: string;
    previousStatus: DeliveryStatusFlow;
    status: DeliveryStatusFlow;
  }
>;

export type NotificationEvent = InventoryLowStockEvent | OrderStatusChangedEvent | DeliveryStatusChangedEvent;
