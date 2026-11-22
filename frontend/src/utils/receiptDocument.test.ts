import { describe, expect, it } from 'vitest';
import type { Order } from '../types';
import { buildOrderReceiptHtml } from './receiptDocument';

const order: Order = {
  id: 'order-1',
  referenceNumber: 'SS-2026-00001',
  customerName: 'Kim & Co',
  contact: '0912 345 6789',
  address: 'Batangas City',
  items: [{ productId: 'glass-1', productName: 'Clear glass panel', quantity: 2, unitPrice: 100, total: 200 }],
  total: 200,
  paidAmount: 50,
  paymentStatus: 'partial',
  orderStatus: 'completed',
  deliveryStatus: 'delivered',
  orderType: 'delivery',
  date: '2026-11-22',
  createdAt: '2026-11-22T05:00:00.000Z',
  notes: 'Call before delivery.',
  refundAmount: 0,
  refundStatus: 'none',
};

describe('buildOrderReceiptHtml', () => {
  it('builds a standalone A4 receipt with item and payment details', () => {
    const html = buildOrderReceiptHtml(order);

    expect(html).toContain('<title>Receipt SS-2026-00001</title>');
    expect(html).toContain('Order Receipt');
    expect(html).toContain('Clear glass panel');
    expect(html).toContain('Order total');
    expect(html).toContain('Payment status');
    expect(html).toContain('Balance');
    expect(html).toContain('Customer signature');
    expect(html).toContain('@page{size:A4 portrait');
  });

  it('escapes customer, item, address, and note values before rendering HTML', () => {
    const unsafeOrder = {
      ...order,
      customerName: '<script>alert(1)</script> & Co',
      address: '<img src=x onerror=alert(1)>',
      items: [{ ...order.items[0], productName: '<b>Glass</b>' }],
      notes: 'Use <script>safe text</script>',
    };
    const html = buildOrderReceiptHtml(unsafeOrder);

    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt; &amp; Co');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(html).toContain('&lt;b&gt;Glass&lt;/b&gt;');
    expect(html).not.toContain('<script>alert(1)</script>');
  });
});
