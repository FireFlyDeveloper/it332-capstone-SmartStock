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

export interface NotificationPageInput {
  limit?: number;
  cursor?: string | null;
  readIds?: string[];
  dismissedIds?: string[];
  unreadOnly?: boolean;
}

export interface NotificationPageResult {
  items: NotificationFeedItem[];
  page: { limit: number; totalCount: number; hasMore: boolean; nextCursor: string | null };
  summary: { totalCount: number; unreadCount: number };
}

const TYPE_ORDER: Record<NotificationFeedItem['type'], number> = { stock: 0, order: 1, delivery: 2 };

function compareNotification(left: NotificationFeedItem, right: NotificationFeedItem): number {
  return TYPE_ORDER[left.type] - TYPE_ORDER[right.type] || left.id.localeCompare(right.id);
}

function encodeNotificationCursor(item: NotificationFeedItem): string {
  return Buffer.from(JSON.stringify({ type: item.type, id: item.id })).toString('base64url');
}

function decodeNotificationCursor(cursor: string): Pick<NotificationFeedItem, 'type' | 'id'> | null {
  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')) as { type?: unknown; id?: unknown };
    if (typeof parsed.id !== 'string' || !(parsed.type === 'stock' || parsed.type === 'order' || parsed.type === 'delivery')) return null;
    return { type: parsed.type, id: parsed.id };
  } catch {
    return null;
  }
}

export function paginateNotificationFeed(feed: NotificationFeedItem[], input: NotificationPageInput = {}): NotificationPageResult {
  const limit = input.limit ?? 25;
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error('limit must be an integer between 1 and 100');
  const cursor = input.cursor ? decodeNotificationCursor(input.cursor) : null;
  if (input.cursor && !cursor) throw new Error('cursor is invalid');

  const readIds = new Set(input.readIds ?? []);
  const dismissedIds = new Set(input.dismissedIds ?? []);
  const visible = feed.filter((item) => !dismissedIds.has(item.id));
  const unreadCount = visible.filter((item) => !readIds.has(item.id)).length;
  const filtered = visible.filter((item) => !input.unreadOnly || !readIds.has(item.id)).sort(compareNotification);
  const afterCursor = cursor
    ? filtered.filter((item) => TYPE_ORDER[item.type] > TYPE_ORDER[cursor.type]
      || (TYPE_ORDER[item.type] === TYPE_ORDER[cursor.type] && item.id.localeCompare(cursor.id) > 0))
    : filtered;
  const lookahead = afterCursor.slice(0, limit + 1);
  const hasMore = lookahead.length > limit;
  const items = lookahead.slice(0, limit);
  return {
    items,
    page: { limit, totalCount: filtered.length, hasMore, nextCursor: hasMore && items.length ? encodeNotificationCursor(items[items.length - 1]) : null },
    summary: { totalCount: visible.length, unreadCount },
  };
}

export function listNewNotificationItems(feed: NotificationFeedItem[], knownIds: string[] = []): NotificationFeedItem[] {
  const known = new Set(knownIds);
  return feed.filter((item) => !known.has(item.id));
}

export function listActiveNotificationIds(feed: NotificationFeedItem[], dismissedIds: string[] = []): string[] {
  const dismissed = new Set(dismissedIds);
  return feed.filter((item) => !dismissed.has(item.id)).map((item) => item.id);
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
