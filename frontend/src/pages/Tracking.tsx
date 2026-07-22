import React, { useMemo, useState } from 'react';
import { Search, Package, CheckCircle, Clock, User, Home, ShoppingBag } from 'lucide-react';
import { apiFetch, type ApiError } from '../api';
import { formatCurrency } from '../utils/helpers';
import { toast } from 'sonner';

type PublicTrackingOrder = {
  referenceNumber: string;
  customerName: string;
  deliveryAddress: string;
  deliveryDate: string;
  orderStatus: 'processing' | 'in_transit' | 'delivered' | 'cancelled';
  paymentStatus: 'unpaid' | 'partial' | 'paid' | 'refunded';
  total: number;
  paidAmount: number;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
};

const statusText: Record<PublicTrackingOrder['orderStatus'], string> = {
  processing: 'Order Processing',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Order Cancelled',
};

const TrackingPage: React.FC = () => {
  const [referenceNumber, setReferenceNumber] = useState('');
  const [order, setOrder] = useState<PublicTrackingOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    const reference = referenceNumber.trim();
    if (!reference) {
      setError('Please enter a reference number');
      return;
    }

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const foundOrder = await apiFetch<PublicTrackingOrder>(`/tracking/${encodeURIComponent(reference)}`, { auth: false });
      setOrder(foundOrder);
      toast.success('Order found');
    } catch (err) {
      const apiError = err as ApiError;
      const message = apiError.status === 404 ? 'Order not found. Please check your reference number.' : apiError.message || 'Unable to track this order right now.';
      setError(message);
      toast.error(apiError.status === 404 ? 'Order not found' : 'Tracking lookup failed');
    } finally {
      setLoading(false);
    }
  };

  const progressSteps = useMemo(
    () => [
      { key: 'processing', label: 'Order Processing', status: 'processing' as const },
      { key: 'packed', label: 'Prepared for Delivery', status: 'processing' as const },
      { key: 'in_transit', label: 'In Transit', status: 'in_transit' as const },
      { key: 'delivered', label: 'Delivered', status: 'delivered' as const },
    ],
    [],
  );

  const currentStepIndex = useMemo(() => {
    if (!order) return -1;
    if (order.orderStatus === 'cancelled') return 0;
    const statusOrder: PublicTrackingOrder['orderStatus'][] = ['processing', 'in_transit', 'delivered'];
    const statusIndex = statusOrder.indexOf(order.orderStatus);
    if (statusIndex === 0) return 1;
    if (statusIndex === 1) return 2;
    if (statusIndex === 2) return 3;
    return -1;
  }, [order]);

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-[var(--success-soft)] text-[var(--success)]';
      case 'partial': return 'bg-accent-soft text-accent';
      case 'unpaid': return 'bg-surface-2 text-text-muted';
      case 'refunded': return 'bg-danger-soft text-danger';
      default: return 'bg-surface-2 text-text-muted';
    }
  };

  return (
    <div className="app-shell min-h-[100dvh] px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center mb-4 inline-flex h-14 w-14 bg-accent rounded-[var(--radius-card)]">
            <Package className="w-8 h-8 text-accent-fg" />
          </div>
          <h1 className="mb-2 text-3xl font-black tracking-tight text-text">Track Your Order</h1>
          <p className="text-text-muted">Enter your reference number to track your order status</p>
        </div>

        <div className="panel p-5 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-subtle" />
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Enter reference number"
                className="input w-full pl-12 pr-4 py-3"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="btn-primary px-8 py-3 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Track Order'}
            </button>
          </div>
          {error && <p className="mt-3 text-danger text-sm">{error}</p>}
        </div>

        {order && (
          <div className="space-y-6">
            <div className="panel p-5">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-text">Order Details</h2>
                  <p className="text-sm text-text-muted">Reference: {order.referenceNumber}</p>
                </div>
                <span className={`px-4 py-2 rounded-[var(--radius-pill)] font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                  {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3 p-4 bg-surface-2 rounded-[var(--radius-card)]">
                  <User className="w-5 h-5 text-accent" />
                  <div>
                    <p className="text-xs text-text-muted">Customer</p>
                    <p className="font-medium text-text">{order.customerName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-surface-2 rounded-[var(--radius-card)]">
                  <Clock className="w-5 h-5 text-accent" />
                  <div>
                    <p className="text-xs text-text-muted">Delivery Date</p>
                    <p className="font-medium text-text">{order.deliveryDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-surface-2 rounded-[var(--radius-card)] md:col-span-2">
                  <Home className="w-5 h-5 text-accent" />
                  <div>
                    <p className="text-xs text-text-muted">Delivery Area</p>
                    <p className="font-medium text-text">{order.deliveryAddress}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="font-semibold text-text mb-3 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  Order Items
                </h3>
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={`${item.name}-${index}`} className="flex justify-between items-center p-3 bg-surface-2 rounded-[var(--radius-input)]">
                      <div>
                        <p className="font-medium text-text">{item.name}</p>
                        <p className="text-sm text-text-muted">Qty: {item.quantity} × {formatCurrency(item.unitPrice)}</p>
                      </div>
                      <span className="font-semibold text-text">{formatCurrency(item.lineTotal)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-4 p-4 bg-accent-soft rounded-[var(--radius-card)]">
                  <span className="font-semibold text-text">Total Amount</span>
                  <span className="text-xl font-bold text-accent">{formatCurrency(order.total)}</span>
                </div>
                {order.paymentStatus !== 'paid' && (
                  <div className="mt-3 p-3 bg-accent-soft rounded-[var(--radius-input)] flex justify-between items-center">
                    <span className="text-sm text-accent">Paid Amount</span>
                    <span className="font-semibold text-accent">{formatCurrency(order.paidAmount)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="panel p-5">
              <h3 className="text-lg font-semibold text-text mb-6">Order Progress</h3>
              <div className="flex items-center justify-between relative">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-surface-2 -translate-y-1/2" />
                <div
                  className="absolute top-1/2 left-0 h-1 bg-accent -translate-y-1/2 transition-all duration-500"
                  style={{ width: `${Math.max(0, (currentStepIndex / (progressSteps.length - 1)) * 100)}%` }}
                />

                {progressSteps.map((step, index) => {
                  const isCompleted = index <= currentStepIndex && order.orderStatus !== 'cancelled';
                  const isCurrent = index === currentStepIndex;

                  return (
                    <div key={step.key} className="relative flex flex-col items-center z-10">
                      <div className={`w-10 h-10 rounded-[var(--radius-pill)] flex items-center justify-center transition-all duration-300 ${
                        isCompleted ? 'bg-accent text-accent-fg' : 'bg-surface-2 text-text-subtle'
                      }`}>
                        {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                      </div>
                      <p className={`mt-2 text-xs font-medium text-center ${
                        isCurrent ? 'text-accent' : isCompleted ? 'text-text' : 'text-text-subtle'
                      }`}>
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 p-4 bg-accent-soft rounded-[var(--radius-card)] text-center">
                <p className="text-sm text-accent mb-1">Current Status</p>
                <p className="text-lg font-bold text-text">{statusText[order.orderStatus]}</p>
              </div>
            </div>
          </div>
        )}

        {!order && !loading && (
          <div className="panel p-6 text-center">
            <Search className="w-12 h-12 text-text-subtle mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text mb-2">How to Track Your Order</h3>
            <p className="text-text-muted mb-4">
              Enter the reference number from your order confirmation. You can find it in:
            </p>
            <ul className="text-left text-text-muted space-y-2 max-w-md mx-auto">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[var(--success)]" />
                SMS notification sent to your phone
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[var(--success)]" />
                Receipt given at the store
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackingPage;
