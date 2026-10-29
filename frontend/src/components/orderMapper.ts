import type { Order } from '../types';

export type BackendPaymentStatus = 'unpaid' | 'partial' | 'paid' | 'refunded';
export type BackendOrderStatus = 'processing' | 'in_transit' | 'delivered' | 'cancelled';

interface BackendOrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface BackendOrder {
  id: string;
  referenceNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryDate: string;
  items: BackendOrderItem[];
  subtotal: number;
  total: number;
  paidAmount: number;
  paymentStatus: BackendPaymentStatus;
  orderStatus: BackendOrderStatus;
  refundedAmount: number;
  refundReason?: string;
  refundType?: 'partial' | 'full';
  createdAt: string;
  updatedAt: string;
}

function toFrontendPaymentStatus(status: BackendPaymentStatus): Order['paymentStatus'] {
  return status === 'unpaid' ? 'pending' : status;
}

function toFrontendOrderStatus(status: BackendOrderStatus): Order['orderStatus'] {
  if (status === 'in_transit') return 'out_for_delivery';
  if (status === 'delivered') return 'completed';
  if (status === 'cancelled') return 'cancelled';
  return 'packed';
}

export function toFrontendOrder(order: BackendOrder): Order {
  return {
    id: order.id,
    referenceNumber: order.referenceNumber,
    customerName: order.customerName,
    contact: order.customerPhone,
    address: order.deliveryAddress,
    items: order.items.map((item) => ({
      productId: item.productId,
      productName: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.lineTotal,
    })),
    total: order.total,
    paidAmount: order.paidAmount,
    paymentStatus: toFrontendPaymentStatus(order.paymentStatus),
    orderStatus: toFrontendOrderStatus(order.orderStatus),
    deliveryStatus: order.orderStatus === 'delivered' ? 'delivered' : order.orderStatus === 'in_transit' ? 'in_transit' : 'scheduled',
    orderType: order.deliveryAddress.toLowerCase() === 'pickup' ? 'pickup' : 'delivery',
    date: order.deliveryDate,
    createdAt: order.createdAt,
    notes: undefined,
    refundAmount: order.refundedAmount,
    refundStatus: order.refundedAmount > 0 ? 'completed' : 'none',
    refundReason: order.refundReason,
  };
}
