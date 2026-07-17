/**
 * Notification hook tests — business services emit serializable events safely.
 *
 * Author: Hermes Agent
 * Last touched: 2026-07-17
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addOutboundStockRecord } from '../inventory/service.js';
import { _resetInventoryStore, listProducts } from '../inventory/store.js';
import { addOrderRecord, editOrderRecord } from '../orders/service.js';
import { _resetOrderStore } from '../orders/store.js';
import { addDeliveryRecord, editDeliveryRecord } from '../delivery/service.js';
import { _resetDeliveryStore } from '../delivery/store.js';
import { sendNotificationEvent } from './webhook.js';

vi.mock('./webhook.js', () => ({
  sendNotificationEvent: vi.fn().mockResolvedValue(undefined),
}));

const sendNotificationEventMock = vi.mocked(sendNotificationEvent);

function validOrderPayload() {
  return {
    customerName: 'Maria Santos',
    customerPhone: '+639****4567',
    deliveryAddress: 'Unit 4, Glassram Building, Batangas City',
    deliveryDate: '2026-08-15',
    items: [{ productId: 'PRD-001', name: 'Tempered Glass Panel', quantity: 2, unitPrice: 1250 }],
  };
}

describe('notification service hooks', () => {
  beforeEach(() => {
    _resetInventoryStore();
    _resetOrderStore();
    _resetDeliveryStore(false);
    sendNotificationEventMock.mockReset();
    sendNotificationEventMock.mockResolvedValue(undefined);
  });

  it('emits inventory.low_stock when an outbound stock update leaves stock at or below threshold', () => {
    const product = listProducts().find((item) => item.sku === 'GLS-CLR-6MM');
    expect(product).toBeDefined();

    const result = addOutboundStockRecord(product!.id, { quantity: 16, referenceNo: 'SO-LOW-1', createdBy: 'admin@smartstock.local' });

    expect(result.ok).toBe(true);
    expect(sendNotificationEventMock).toHaveBeenCalledWith(expect.objectContaining({
      type: 'inventory.low_stock',
      data: expect.objectContaining({
        productId: product!.id,
        sku: 'GLS-CLR-6MM',
        stock: 8,
        threshold: 8,
        movementType: 'outbound',
      }),
    }));
  });

  it('emits order.status_changed when order status changes', () => {
    const created = addOrderRecord(validOrderPayload());
    if (!created.ok) throw new Error(created.error);

    const result = editOrderRecord(created.data.id, { orderStatus: 'in_transit' });

    expect(result.ok).toBe(true);
    expect(sendNotificationEventMock).toHaveBeenCalledWith(expect.objectContaining({
      type: 'order.status_changed',
      data: expect.objectContaining({
        orderId: created.data.id,
        referenceNumber: created.data.referenceNumber,
        previousStatus: 'processing',
        status: 'in_transit',
      }),
    }));
  });

  it('emits delivery.status_changed when delivery status changes', () => {
    const created = addDeliveryRecord({
      orderId: 'ORD-900',
      driver: 'Nina Ramos',
      truckNumber: 'Truck-900',
      destination: 'Glassram Warehouse, Batangas',
      status: 'pending',
      currentStep: 0,
    });
    if (!created.ok) throw new Error(created.error);

    const result = editDeliveryRecord(created.data.id, { status: 'assigned', currentStep: 1 });

    expect(result.ok).toBe(true);
    expect(sendNotificationEventMock).toHaveBeenCalledWith(expect.objectContaining({
      type: 'delivery.status_changed',
      data: expect.objectContaining({
        deliveryId: created.data.id,
        orderId: 'ORD-900',
        previousStatus: 'pending',
        status: 'assigned',
      }),
    }));
  });

  it('does not fail stock updates when notification delivery rejects', () => {
    sendNotificationEventMock.mockRejectedValueOnce(new Error('webhook unavailable'));
    const product = listProducts().find((item) => item.sku === 'GLS-CLR-6MM')!;

    const result = addOutboundStockRecord(product.id, { quantity: 16, referenceNo: 'SO-LOW-FAIL', createdBy: 'admin@smartstock.local' });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.product.stock).toBe(8);
  });
});
