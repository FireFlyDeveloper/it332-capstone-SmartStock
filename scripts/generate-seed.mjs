import fs from 'node:fs';

const mockPath = 'frontend/src/data/mockData.ts';
const content = fs.readFileSync(mockPath, 'utf8');

// Extract initialProducts
const prodMatch = content.match(/export const initialProducts: Product\[\] = (\[[\s\S]*?\]);/);
if (!prodMatch) throw new Error('Could not find initialProducts');
const products = JSON.parse(prodMatch[1]);

// Extract initialOrders
const ordMatch = content.match(/export const initialOrders: Order\[\] = (\[[\s\S]*?\]);/);
if (!ordMatch) throw new Error('Could not find initialOrders');
const rawOrders = JSON.parse(ordMatch[1]);

// Extract initialDeliveries
const delivMatch = content.match(/export const initialDeliveries: Delivery\[\] = (\[[\s\S]*?\]);/);
if (!delivMatch) throw new Error('Could not find initialDeliveries');
const deliveries = JSON.parse(delivMatch[1]);

function mapOrderStatus(status) {
  if (status === 'out_for_delivery') return 'in_transit';
  if (status === 'completed') return 'delivered';
  if (status === 'cancelled') return 'cancelled';
  return 'processing';
}

function mapPaymentStatus(status) {
  if (status === 'pending') return 'unpaid';
  return status;
}

const orders = rawOrders.map((o) => {
  const items = (o.items || []).map((i) => ({
    productId: i.productId,
    name: i.productName || i.name,
    quantity: i.quantity,
    unitPrice: i.unitPrice,
    lineTotal: i.total || i.lineTotal || (i.quantity * i.unitPrice),
  }));
  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
  return {
    id: o.id,
    referenceNumber: o.referenceNumber,
    customerName: o.customerName,
    customerPhone: o.contact || o.customerPhone || '0910-000-0000',
    deliveryAddress: o.address || o.deliveryAddress || 'Pickup',
    deliveryDate: o.date || o.deliveryDate || '2026-01-01',
    items,
    subtotal: o.subtotal || subtotal,
    total: o.total || subtotal,
    paidAmount: o.paidAmount || 0,
    paymentStatus: mapPaymentStatus(o.paymentStatus || 'unpaid'),
    orderStatus: mapOrderStatus(o.orderStatus || 'processing'),
    refundedAmount: o.refundAmount || o.refundedAmount || 0,
    refundReason: o.refundReason,
    refundType: o.refundAmount > 0 ? (o.refundAmount >= o.total ? 'full' : 'partial') : undefined,
    createdAt: o.createdAt || (o.date ? o.date + 'T08:00:00Z' : new Date().toISOString()),
    updatedAt: o.createdAt || new Date().toISOString(),
  };
});

// Generate stock movements:
const suppliers = [
  'Asahi Glass Philippines',
  'AGC Flat Glass',
  'Pioneer Aluminum Inc',
  'Republic Glass & Aluminum',
  'Apex Extrusions Corp'
];

const movements = [];
let movementSeq = 1;

// 1. Inbound restocks for every product across past months
products.forEach((p, idx) => {
  const supplier = suppliers[idx % suppliers.length];
  // Initial restock
  movements.push({
    id: 'MOV-' + String(movementSeq++).padStart(6, '0'),
    productId: p.id,
    type: 'inbound',
    quantity: p.stock + 60,
    referenceNo: 'PO-2026-' + String(idx + 1).padStart(4, '0'),
    supplier,
    occurredAt: '2026-01-05T09:00:00Z',
    createdBy: 'admin@smartstock.local',
  });
  // Mid-year restock
  movements.push({
    id: 'MOV-' + String(movementSeq++).padStart(6, '0'),
    productId: p.id,
    type: 'inbound',
    quantity: 40,
    referenceNo: 'PO-2026-RESTOCK-' + String(idx + 1).padStart(4, '0'),
    supplier,
    occurredAt: '2026-04-12T10:30:00Z',
    createdBy: 'staff@smartstock.local',
  });
});

// 2. Outbound movements for all order items
orders.forEach((o, oIdx) => {
  if (o.orderStatus === 'cancelled') return;
  o.items.forEach((item, iIdx) => {
    movements.push({
      id: 'MOV-' + String(movementSeq++).padStart(6, '0'),
      productId: item.productId,
      type: 'outbound',
      quantity: item.quantity,
      referenceNo: 'SO-' + o.referenceNumber + '-' + (iIdx + 1),
      supplier: undefined,
      occurredAt: o.createdAt,
      createdBy: 'staff@smartstock.local',
    });
  });
});

const outCode = `/**
 * Seed data for Glassram Glass & Aluminum Supply
 * 120 Products, 360 Orders, 210 Deliveries, and Stock Movements
 */
import type { Product, StockMovement } from '../inventory/store.js';
import type { Order } from '../orders/store.js';
import type { Delivery } from '../delivery/store.js';

export const seedProducts: Product[] = ${JSON.stringify(products, null, 2)};

export const seedOrders: Order[] = ${JSON.stringify(orders, null, 2)};

export const seedDeliveries: Delivery[] = ${JSON.stringify(deliveries, null, 2)};

export const seedMovements: StockMovement[] = ${JSON.stringify(movements, null, 2)};
`;

fs.writeFileSync('backend/src/db/seedData.ts', outCode, 'utf8');
console.log('Successfully generated backend/src/db/seedData.ts with:');
console.log('Products:', products.length);
console.log('Orders:', orders.length);
console.log('Deliveries:', deliveries.length);
console.log('Movements:', movements.length);
