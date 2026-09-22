import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  AlertOctagon,
  ShoppingBag,
  Truck,
  X,
  ExternalLink,
  BellOff,
  Package,
} from 'lucide-react';
import { useData } from './DataContext';
import { formatCurrency, checkStockStatus } from '../utils/helpers';

export interface NotificationItem {
  id: string;
  type: 'stock' | 'order' | 'delivery';
  severity: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timeAgo: string;
  link: string;
}

const READ_STORAGE_KEY = 'smartstock_read_notifications';
const DISMISSED_STORAGE_KEY = 'smartstock_dismissed_notifications';

export const NotificationDropdown: React.FC = () => {
  const { products, orders } = useData();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Read / Dismissed IDs in localStorage
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(READ_STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(DISMISSED_STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Save to localStorage when state changes
  useEffect(() => {
    try {
      localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(Array.from(readIds)));
    } catch {
      // ignore
    }
  }, [readIds]);

  useEffect(() => {
    try {
      localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(Array.from(dismissedIds)));
    } catch {
      // ignore
    }
  }, [dismissedIds]);

  // Click outside and Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Generate dynamic notifications from real products and orders
  const allNotifications = useMemo<NotificationItem[]>(() => {
    const list: NotificationItem[] = [];

    // 1. Stock Alerts
    products.forEach((p) => {
      const status = checkStockStatus(p.stock, p.threshold);
      if (status === 'critical' || p.stock === 0) {
        list.push({
          id: `stock-${p.id}`,
          type: 'stock',
          severity: 'critical',
          title: `Critical Stock: ${p.name}`,
          message: p.stock === 0 
            ? 'Item is completely out of stock! Restock urgently.'
            : `Only ${p.stock} remaining (min safety threshold is ${p.threshold}).`,
          timeAgo: 'Urgent',
          link: '/inventory',
        });
      } else if (status === 'low') {
        list.push({
          id: `stock-${p.id}`,
          type: 'stock',
          severity: 'warning',
          title: `Low Stock: ${p.name}`,
          message: `${p.stock} units remaining. Reorder suggested soon.`,
          timeAgo: 'Action needed',
          link: '/inventory',
        });
      }
    });

    // 2. Orders Alerts
    orders.forEach((o) => {
      if (o.orderStatus === 'pending') {
        list.push({
          id: `order-pending-${o.id}`,
          type: 'order',
          severity: 'info',
          title: `Pending Order: ${o.referenceNumber}`,
          message: `Order for ${o.customerName} (${formatCurrency(o.total)}) awaits processing.`,
          timeAgo: o.date || 'Recent',
          link: '/orders',
        });
      } else if (o.paymentStatus === 'pending' || o.paymentStatus === 'partial') {
        list.push({
          id: `order-payment-${o.id}`,
          type: 'order',
          severity: 'warning',
          title: `Payment ${o.paymentStatus === 'partial' ? 'Partial' : 'Pending'}: ${o.referenceNumber}`,
          message: `${o.customerName} has ${formatCurrency(o.total - (o.paidAmount || 0))} balance remaining.`,
          timeAgo: o.date || 'Recent',
          link: '/orders',
        });
      }

      // 3. Deliveries in transit
      if (o.orderStatus === 'out_for_delivery' || o.deliveryStatus === 'in_transit') {
        list.push({
          id: `delivery-transit-${o.id}`,
          type: 'delivery',
          severity: 'info',
          title: `Out for Delivery: ${o.referenceNumber}`,
          message: `En route to ${o.customerName} (${o.address || 'Destination'}).`,
          timeAgo: 'En route',
          link: '/delivery',
        });
      }
    });

    return list;
  }, [products, orders]);

  // Filter out dismissed
  const visibleNotifications = useMemo(() => {
    return allNotifications.filter((n) => !dismissedIds.has(n.id));
  }, [allNotifications, dismissedIds]);

  // Unread count
  const unreadCount = useMemo(() => {
    return visibleNotifications.filter((n) => !readIds.has(n.id)).length;
  }, [visibleNotifications, readIds]);

  // Filtered by tab
  const displayedNotifications = useMemo(() => {
    if (activeTab === 'unread') {
      return visibleNotifications.filter((n) => !readIds.has(n.id));
    }
    return visibleNotifications;
  }, [visibleNotifications, activeTab, readIds]);

  const markAllAsRead = () => {
    const newSet = new Set(readIds);
    visibleNotifications.forEach((n) => newSet.add(n.id));
    setReadIds(newSet);
  };

  const handleNotificationClick = (item: NotificationItem) => {
    setReadIds((prev) => new Set(prev).add(item.id));
    setIsOpen(false);
    navigate(item.link);
  };

  const handleDismiss = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDismissedIds((prev) => new Set(prev).add(id));
  };

  const getIcon = (item: NotificationItem) => {
    switch (item.type) {
      case 'stock':
        return item.severity === 'critical' ? (
          <AlertOctagon className="w-4 h-4 text-rose-600" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-amber-600" />
        );
      case 'delivery':
        return <Truck className="w-4 h-4 text-sky-600" />;
      case 'order':
      default:
        return <ShoppingBag className="w-4 h-4 text-[#4f46e5]" />;
    }
  };

  const getIconBg = (item: NotificationItem) => {
    switch (item.type) {
      case 'stock':
        return item.severity === 'critical' ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100';
      case 'delivery':
        return 'bg-sky-50 border-sky-100';
      case 'order':
      default:
        return 'bg-indigo-50 border-indigo-100';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-2xl transition-all ${
          isOpen
            ? 'bg-indigo-50 text-[#4f46e5]'
            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
        }`}
        title="Notifications"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#f43f5e] px-1 text-[10px] font-extrabold text-white ring-2 ring-white shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-white rounded-[24px] border border-[#f1f5f9] shadow-2xl z-50 overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="p-4 border-b border-[#f1f5f9] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#4f46e5] flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-slate-900 text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-600 border border-rose-100">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">Inventory &amp; Operations alerts</p>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold text-[#4f46e5] hover:bg-indigo-50 transition-colors"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark read</span>
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 px-4 py-2 bg-slate-50/70 border-b border-slate-100">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All ({visibleNotifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('unread')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'unread'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notifications Scrollable List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100">
            {displayedNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-300 flex items-center justify-center mx-auto mb-3">
                  <BellOff className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-700">All caught up!</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  {activeTab === 'unread'
                    ? 'No unread notifications right now.'
                    : 'No notifications at this time.'}
                </p>
              </div>
            ) : (
              displayedNotifications.map((item) => {
                const isRead = readIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer group hover:bg-slate-50 ${
                      !isRead ? 'bg-indigo-50/20' : 'bg-white'
                    }`}
                  >
                    {/* Icon Box */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${getIconBg(
                        item
                      )}`}
                    >
                      {getIcon(item)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p
                          className={`text-xs truncate ${
                            !isRead ? 'font-extrabold text-slate-900' : 'font-semibold text-slate-700'
                          }`}
                        >
                          {item.title}
                        </p>
                        {!isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#4f46e5] shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                        {item.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {item.timeAgo}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-[#4f46e5] opacity-0 group-hover:opacity-100 transition-opacity">
                          <span>View</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </div>
                      </div>
                    </div>

                    {/* Dismiss Button */}
                    <button
                      type="button"
                      onClick={(e) => handleDismiss(e, item.id)}
                      className="p-1 text-slate-300 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100"
                      title="Dismiss"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Dropdown Footer */}
          <div className="p-3 bg-slate-50/70 border-t border-[#f1f5f9] flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/inventory');
              }}
              className="flex items-center gap-1 font-bold text-slate-600 hover:text-[#4f46e5] transition-colors"
            >
              <Package className="w-3.5 h-3.5" />
              <span>Inventory</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/delivery');
              }}
              className="flex items-center gap-1 font-bold text-slate-600 hover:text-[#4f46e5] transition-colors"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Deliveries</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
