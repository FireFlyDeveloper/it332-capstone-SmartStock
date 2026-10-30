import type { Order } from '../orders/store.js';
import type { Product } from '../inventory/store.js';

export interface NotificationFeedItem {
  id: string;
  type: 'stock' | 'order' | 'delivery';
  severity: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  contextLabel: string;
  link: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

function stockStatus(stock: number, threshold: number): 'critical' | 'low' | 'healthy' | 'out_of_stock' {
  if (stock <= 0) return 'out_of_stock';
  if (stock <= threshold * 0.5) return 'critical';
  if (stock <= threshold) return 'low';
  return 'healthy';
}

export function buildNotificationFeed(products: Product[], orders: Order[]): NotificationFeedItem[] {
  const list: NotificationFeedItem[] = [];

  for (const product of products) {
    const status = stockStatus(product.stock, product.threshold);
    if (status === 'critical' || product.stock === 0) {
      list.push({
        id: `stock-${product.id}`,
        type: 'stock',
        severity: 'critical',
        title: `Critical Stock: ${product.name}`,
        message: product.stock === 0
          ? 'Item is completely out of stock! Restock urgently.'
          : `Only ${product.stock} remaining (min safety threshold is ${product.threshold}).`,
        contextLabel: 'Urgent',
        link: '/inventory',
      });
    } else if (status === 'low') {
      list.push({
        id: `stock-${product.id}`,
        type: 'stock',
        severity: 'warning',
        title: `Low Stock: ${product.name}`,
        message: `${product.stock} units remaining. Reorder suggested soon.`,
        contextLabel: 'Action needed',
        link: '/inventory',
      });
    }
  }

  for (const order of orders) {
    if (order.orderStatus === 'processing') {
      list.push({
        id: `order-pending-${order.id}`,
        type: 'order',
        severity: 'info',
        title: `Processing Order: ${order.referenceNumber}`,
        message: `Order for ${order.customerName} (${formatCurrency(order.total)}) is being processed.`,
        contextLabel: `Created ${formatDate(order.createdAt)}`,
        link: '/orders',
      });
    } else if (order.paymentStatus === 'unpaid' || order.paymentStatus === 'partial') {
      list.push({
        id: `order-payment-${order.id}`,
        type: 'order',
        severity: 'warning',
        title: `Payment ${order.paymentStatus === 'partial' ? 'Partial' : 'Pending'}: ${order.referenceNumber}`,
        message: `${order.customerName} has ${formatCurrency(order.total - (order.paidAmount || 0))} balance remaining.`,
        contextLabel: `Created ${formatDate(order.createdAt)}`,
        link: '/orders',
      });
    }

    if (order.orderStatus === 'in_transit') {
      list.push({
        id: `delivery-transit-${order.id}`,
        type: 'delivery',
        severity: 'info',
        title: `Out for Delivery: ${order.referenceNumber}`,
        message: `En route to ${order.customerName} (${order.deliveryAddress || 'Destination'}).`,
        contextLabel: 'En route',
        link: '/delivery',
      });
    }
  }

  return list;
}
