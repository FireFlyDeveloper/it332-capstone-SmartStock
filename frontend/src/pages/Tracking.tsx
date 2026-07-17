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
      toast.success('Order found!');
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
      case 'paid': return 'bg-green-100 text-green-700';
      case 'partial': return 'bg-yellow-100 text-yellow-700';
      case 'unpaid': return 'bg-gray-100 text-gray-700';
      case 'refunded': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Your Order</h1>
          <p className="text-gray-600">Enter your reference number to track your order status</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Enter reference number (e.g., SS-2026-00001)"
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Track Order'}
            </button>
          </div>
          {error && <p className="mt-3 text-red-600 text-sm">{error}</p>}
        </div>

        {order && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Order Details</h2>
                  <p className="text-sm text-gray-500">Reference: {order.referenceNumber}</p>
                </div>
                <span className={`px-4 py-2 rounded-full font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                  {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <User className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-500">Customer</p>
                    <p className="font-medium text-gray-900">{order.customerName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-500">Delivery Date</p>
                    <p className="font-medium text-gray-900">{order.deliveryDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl md:col-span-2">
                  <Home className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-500">Delivery Area</p>
                    <p className="font-medium text-gray-900">{order.deliveryAddress}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  Order Items
                </h3>
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={`${item.name}-${index}`} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity} × {formatCurrency(item.unitPrice)}</p>
                      </div>
                      <span className="font-semibold text-gray-900">{formatCurrency(item.lineTotal)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-4 p-4 bg-blue-50 rounded-xl">
                  <span className="font-semibold text-gray-900">Total Amount</span>
                  <span className="text-xl font-bold text-blue-600">{formatCurrency(order.total)}</span>
                </div>
                {order.paymentStatus !== 'paid' && (
                  <div className="mt-3 p-3 bg-yellow-50 rounded-lg flex justify-between items-center">
                    <span className="text-sm text-yellow-800">Paid Amount</span>
                    <span className="font-semibold text-yellow-800">{formatCurrency(order.paidAmount)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Order Progress</h3>
              <div className="flex items-center justify-between relative">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2" />
                <div
                  className="absolute top-1/2 left-0 h-1 bg-blue-600 -translate-y-1/2 transition-all duration-500"
                  style={{ width: `${Math.max(0, (currentStepIndex / (progressSteps.length - 1)) * 100)}%` }}
                />

                {progressSteps.map((step, index) => {
                  const isCompleted = index <= currentStepIndex && order.orderStatus !== 'cancelled';
                  const isCurrent = index === currentStepIndex;

                  return (
                    <div key={step.key} className="relative flex flex-col items-center z-10">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isCompleted ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
                      }`}>
                        {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                      </div>
                      <p className={`mt-2 text-xs font-medium text-center ${
                        isCurrent ? 'text-blue-600' : isCompleted ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {step.label}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 p-4 bg-blue-50 rounded-xl text-center">
                <p className="text-sm text-blue-600 mb-1">Current Status</p>
                <p className="text-lg font-bold text-blue-900">{statusText[order.orderStatus]}</p>
              </div>
            </div>
          </div>
        )}

        {!order && !loading && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">How to Track Your Order</h3>
            <p className="text-gray-600 mb-4">
              Enter the reference number from your order confirmation. You can find it in:
            </p>
            <ul className="text-left text-gray-600 space-y-2 max-w-md mx-auto">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Your order confirmation email
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                SMS notification sent to your phone
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
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
