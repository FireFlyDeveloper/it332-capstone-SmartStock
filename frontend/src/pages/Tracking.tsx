import React, { useState, useMemo } from 'react';
import { Search, Package, CheckCircle, Clock, Phone, User, Home, ShoppingBag } from 'lucide-react';
import { useData } from '../components/DataContext';
import { apiFetch } from '../api';
import type { Order } from '../types';
import { formatCurrency } from '../utils/helpers';
import { toast } from 'sonner';

type PublicTrackingOrder = {
  referenceNumber: string;
  customerName: string;
  deliveryAddress?: string;
  deliveryDate?: string;
  orderStatus: string;
  paymentStatus: string;
  total: number;
  paidAmount: number;
  items: Array<{
    name?: string;
    productName?: string;
    quantity: number;
    unitPrice: number;
    lineTotal?: number;
    total?: number;
  }>;
  contact?: string;
  address?: string;
  orderType?: 'pickup' | 'delivery';
};

const TrackingPage: React.FC = () => {
  const { orders } = useData();
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
      // 1. Attempt backend public tracking endpoint
      const backendOrder = await apiFetch<PublicTrackingOrder>(
        `/tracking/${encodeURIComponent(reference)}`,
        { auth: false }
      );
      if (backendOrder && backendOrder.referenceNumber) {
        setOrder({
          ...backendOrder,
          address: backendOrder.deliveryAddress || backendOrder.address,
        });
        toast.success('Order found!');
        setLoading(false);
        return;
      }
    } catch {
      // Fall through to local demo orders search
    }

    // 2. Fallback to local memory orders (for demo or offline)
    const foundOrder = orders.find(
      (o: Order) =>
        o.referenceNumber.toLowerCase() === reference.toLowerCase() ||
        o.id.toLowerCase() === reference.toLowerCase(),
    );

    if (foundOrder) {
      setOrder(foundOrder);
      toast.success('Order found!');
    } else {
      setError('Order not found. Please check your reference number.');
      toast.error('Order not found');
    }
    setLoading(false);
  };

  // Calculate order progress based on status
  const progressSteps = useMemo(() => {
    if (!order) return [];

    if (order.orderType === 'pickup') {
      return [
        { key: 'pending', label: 'Order Placed' },
        { key: 'ready_for_pickup', label: 'Ready for Pickup' },
        { key: 'completed', label: 'Completed / Picked Up' }
      ];
    } else {
      return [
        { key: 'pending', label: 'Order Placed' },
        { key: 'packed', label: 'Packed' },
        { key: 'out_for_delivery', label: 'Out for Delivery' },
        { key: 'completed', label: 'Delivered' }
      ];
    }
  }, [order]);

  const currentStepIndex = useMemo(() => {
    if (!order) return -1;
    const status = order.orderStatus.toLowerCase();
    if (status === 'completed' || status === 'delivered') return progressSteps.length - 1;
    if (status === 'in_transit' || status === 'out_for_delivery') return 2;
    if (status === 'packed' || status === 'ready_for_pickup' || status === 'processing') return 1;
    if (status === 'pending') return 0;
    return 0;
  }, [order, progressSteps]);

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid': return 'bg-emerald-100 text-emerald-700';
      case 'partial': return 'bg-amber-100 text-amber-700';
      case 'pending':
      case 'unpaid': return 'bg-slate-100 text-slate-700';
      case 'refunded': return 'bg-rose-100 text-rose-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusText = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'pending') return 'Order Placed - Awaiting Confirmation';
    if (s === 'ready_for_pickup') return 'Ready for Pickup';
    if (s === 'packed') return 'Order Packed - Ready for Delivery';
    if (s === 'out_for_delivery' || s === 'in_transit') return 'Out for Delivery / In Transit';
    if (s === 'completed' || s === 'delivered') return 'Order Completed & Delivered';
    if (s === 'cancelled') return 'Order Cancelled';
    return status.replace(/_/g, ' ');
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-[-0.02em]">
            Live Shipment &amp; Delivery Tracking
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Enter your reference number to track an order and its real-time delivery status.
          </p>
        </div>
      </div>

      {/* Search Box */}
      <div className="bg-white rounded-[32px] shadow-sm border border-[#f1f5f9] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. SS-2026-00001 or ORD-001"
              className="w-full pl-12 pr-4 py-3 bg-[#f8fafc] border border-slate-200/80 rounded-2xl focus:ring-2 focus:ring-[#4f46e5]/30 focus:border-[#4f46e5] outline-none text-sm text-slate-800 font-medium"
              onKeyPress={(e) => e.key === 'Enter' && void handleSearch()}
            />
          </div>
          <button
            onClick={() => void handleSearch()}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Searching...' : 'Track Order'}
          </button>
        </div>
        {error && (
          <p className="mt-3 text-rose-600 text-xs font-bold">{error}</p>
        )}
      </div>

      {/* Results */}
      {order && (
        <div className="space-y-6">
          {/* Order Info Card */}
          <div className="bg-white rounded-[32px] shadow-sm border border-[#f1f5f9] p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-black text-slate-900">Order Details</h2>
                <p className="text-xs text-slate-500 mt-0.5">Reference: <span className="font-mono font-bold text-slate-800">{order.referenceNumber}</span></p>
              </div>
              <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${getPaymentStatusColor(order.paymentStatus)}`}>
                Payment: {order.paymentStatus.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-3 p-4 bg-[#f8fafc] rounded-2xl border border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#4f46e5] flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Customer</p>
                  <p className="font-extrabold text-slate-900">{order.customerName}</p>
                </div>
              </div>

              {order.contact && (
                <div className="flex items-center gap-3 p-4 bg-[#f8fafc] rounded-2xl border border-slate-100">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#4f46e5] flex items-center justify-center">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Contact</p>
                    <p className="font-extrabold text-slate-900">{order.contact}</p>
                  </div>
                </div>
              )}

              {(order.address || order.deliveryAddress) && (
                <div className="flex items-center gap-3 p-4 bg-[#f8fafc] rounded-2xl border border-slate-100 md:col-span-2">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#4f46e5] flex items-center justify-center">
                    <Home className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Delivery Address</p>
                    <p className="font-extrabold text-slate-900">{order.address || order.deliveryAddress}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Items */}
            <div className="border-t border-slate-100 pt-6">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                <ShoppingBag className="w-4 h-4 text-[#4f46e5]" />
                Order Items
              </h3>
              <div className="space-y-2">
                {order.items.map((item, index) => {
                  const name = item.productName || item.name || 'Custom item';
                  const price = item.unitPrice || 0;
                  const itemTotal = item.lineTotal || item.total || (item.quantity * price);
                  return (
                    <div key={index} className="flex justify-between items-center p-3.5 bg-[#f8fafc] rounded-2xl border border-slate-100">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{name}</p>
                        <p className="text-xs text-slate-500">Qty: {item.quantity} × {formatCurrency(price)}</p>
                      </div>
                      <span className="font-extrabold text-slate-900 text-sm">{formatCurrency(itemTotal)}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center mt-4 p-5 bg-indigo-50/60 rounded-2xl border border-indigo-100">
                <span className="font-bold text-slate-700 text-sm">Total Amount</span>
                <span className="text-xl font-black text-[#4f46e5]">{formatCurrency(order.total)}</span>
              </div>

              {order.paymentStatus !== 'paid' && order.paidAmount > 0 && (
                <div className="mt-3 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex justify-between items-center">
                  <span className="text-xs font-bold text-amber-800">Paid Amount</span>
                  <span className="font-black text-amber-900">{formatCurrency(order.paidAmount)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Progress Timeline */}
          <div className="bg-white rounded-[32px] shadow-sm border border-[#f1f5f9] p-6 sm:p-8">
            <h3 className="text-lg font-black text-slate-900 mb-6">Order Progress</h3>
            
            {/* Steps */}
            <div className="flex items-start w-full relative">
              {progressSteps.map((step, index, arr) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                
                return (
                  <div key={step.key} className="relative flex-1 flex flex-col items-center">
                    {/* Connecting line to next step */}
                    {index < arr.length - 1 && (
                      <div className="absolute top-5 left-1/2 w-full h-1 -translate-y-1/2 bg-slate-100 z-0">
                        <div 
                          className="h-full bg-[#4f46e5] transition-all duration-500"
                          style={{ width: index < currentStepIndex ? '100%' : '0%' }}
                        />
                      </div>
                    )}

                    <div className={`relative z-10 w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                      isCompleted 
                        ? 'bg-[#4f46e5] text-white shadow-md shadow-indigo-900/20' 
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Clock className="w-5 h-5" />
                      )}
                    </div>
                    <p className={`mt-2 text-xs font-bold text-center px-1 leading-tight ${
                      isCurrent ? 'text-[#4f46e5]' : isCompleted ? 'text-slate-900' : 'text-slate-400'
                    }`}>
                      {step.label}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Current Status */}
            <div className="mt-8 p-4 bg-[#f8fafc] rounded-2xl border border-slate-100 text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Current Status</p>
              <p className="text-base font-black text-[#4f46e5]">
                {getStatusText(order.orderStatus)}
              </p>
            </div>
          </div>

          {/* Pickup Info (if applicable) */}
          {order.orderType === 'pickup' && order.orderStatus !== 'completed' && (
            <div className="bg-white rounded-[32px] shadow-sm border border-[#f1f5f9] p-6 sm:p-8">
              <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-[#4f46e5]" />
                Pickup Information
              </h3>
              <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100">
                <p className="text-xs text-[#4f46e5] font-bold mb-2">
                  Please bring your reference confirmation and proceed to our warehouse to pick up your materials.
                </p>
                <p className="text-xs text-slate-600">
                  <strong className="text-slate-800">Pickup Location:</strong> Glassram Warehouse, Manila
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  <strong className="text-slate-800">Business Hours:</strong> Mon–Sat 8:00 AM – 6:00 PM
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      {!order && !loading && (
        <div className="bg-white rounded-[32px] shadow-sm border border-[#f1f5f9] p-8 text-center">
          <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-extrabold text-slate-900 tracking-[-0.02em] mb-2">
            How to track your order?
          </h3>
          <p className="text-slate-500 text-sm mb-4">
            Enter the reference number found on your order confirmation email, invoice, or SMS.
          </p>
          <ul className="text-left text-slate-600 text-xs space-y-2.5 max-w-md mx-auto">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              SmartStock order confirmation email
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              SMS notification sent to recipient
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              Delivery dispatch note or receipt from driver
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default TrackingPage;
