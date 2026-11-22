import type { Order } from '../types';

export function canRecordOrderPayment(order: Pick<Order, 'orderStatus' | 'paidAmount' | 'total'>): boolean {
  return order.orderStatus !== 'cancelled' && order.paidAmount < order.total;
}
