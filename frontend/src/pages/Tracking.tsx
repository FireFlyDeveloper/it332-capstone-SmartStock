import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Package, 
  CheckCircle, 
  Clock, 
  Phone, 
  User, 
  ShoppingBag, 
  Truck, 
  Copy, 
  Printer, 
  MapPin, 
  ShieldCheck, 
  RefreshCw, 
  AlertCircle
} from 'lucide-react';
import { useData } from '../components/DataContext';
import { apiFetch } from '../api';
import type { Order } from '../types';
import { formatCurrency, formatDate } from '../utils/helpers';
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

export const TrackingPage: React.FC = () => {
  const { referenceNumber: urlRef } = useParams<{ referenceNumber?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryRef = searchParams.get('ref') || searchParams.get('order') || '';
  
  const { orders } = useData();

  const [referenceInput, setReferenceInput] = useState(urlRef || queryRef || '');
  const [order, setOrder] = useState<PublicTrackingOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const executeSearch = useCallback(async (refToSearch: string) => {
    const cleanRef = refToSearch.trim();
    if (!cleanRef) {
      setError('Please enter a reference number.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Attempt public unauthenticated backend tracking endpoint
      const backendOrder = await apiFetch<PublicTrackingOrder>(
        `/tracking/${encodeURIComponent(cleanRef)}`,
        { auth: false }
      );
      if (backendOrder && backendOrder.referenceNumber) {
        setOrder({
          ...backendOrder,
          address: backendOrder.deliveryAddress || backendOrder.address,
        });
        setLastRefreshed(new Date());
        setLoading(false);
        return;
      }
    } catch {
      // Fall through to memory demo store
    }

    // 2. Fallback to local memory orders (for demo or offline)
    const foundOrder = orders.find(
      (o: Order) =>
        o.referenceNumber.toLowerCase() === cleanRef.toLowerCase() ||
        o.id.toLowerCase() === cleanRef.toLowerCase(),
    );

    if (foundOrder) {
      setOrder(foundOrder);
      setLastRefreshed(new Date());
    } else {
      setOrder(null);
      setError(`No active order found with reference "${cleanRef}". Please verify and try again.`);
      toast.error('Order not found');
    }
    setLoading(false);
  }, [orders]);

  // Initial load when referenceNumber param or query exists
  useEffect(() => {
    const targetRef = urlRef || queryRef;
    if (targetRef && targetRef !== order?.referenceNumber) {
      setReferenceInput(targetRef);
      void executeSearch(targetRef);
    }
  }, [urlRef, queryRef, executeSearch, order?.referenceNumber]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!referenceInput.trim()) {
      setError('Please enter a reference number.');
      return;
    }
    setSearchParams({ ref: referenceInput.trim() });
    void executeSearch(referenceInput);
  };

  const handleQuickPreset = (presetRef: string) => {
    setReferenceInput(presetRef);
    setSearchParams({ ref: presetRef });
    void executeSearch(presetRef);
  };

  const handleCopyLink = () => {
    if (!order) return;
    const url = `${window.location.origin}/tracking/${encodeURIComponent(order.referenceNumber)}`;
    navigator.clipboard.writeText(url);
    toast.success('Tracking link copied to clipboard!');
  };

  const handlePrint = () => {
    toast.info('Opening print preview...');
    window.print();
  };

  // Progress steps for pickup vs delivery
  const progressSteps = useMemo(() => {
    if (!order) return [];

    if (order.orderType === 'pickup') {
      return [
        { key: 'pending', label: 'Order Placed', desc: 'Order confirmed' },
        { key: 'ready_for_pickup', label: 'Ready for Pickup', desc: 'Prepared at warehouse' },
        { key: 'completed', label: 'Completed', desc: 'Picked up by customer' },
      ];
    } else {
      return [
        { key: 'pending', label: 'Order Placed', desc: 'Order confirmed' },
        { key: 'packed', label: 'Packed & Inspected', desc: 'Ready for loading' },
        { key: 'out_for_delivery', label: 'Out for Delivery', desc: 'Dispatched with truck' },
        { key: 'completed', label: 'Delivered', desc: 'Received & signed' },
      ];
    }
  }, [order]);

  const currentStepIndex = useMemo(() => {
    if (!order) return 0;
    const status = order.orderStatus.toLowerCase();
    if (status === 'completed' || status === 'delivered') return progressSteps.length - 1;
    if (status === 'in_transit' || status === 'out_for_delivery') return progressSteps.length === 3 ? 1 : 2;
    if (status === 'packed' || status === 'ready_for_pickup' || status === 'processing') return 1;
    return 0;
  }, [order, progressSteps]);

  const getPaymentBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'paid') {
      return <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">Paid in Full</span>;
    }
    if (s === 'partial') {
      return <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">Partial Payment</span>;
    }
    if (s === 'refunded') {
      return <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">Refunded</span>;
    }
    return <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">Payment Pending</span>;
  };

  const getOrderStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'completed' || s === 'delivered') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Delivered</span>
        </span>
      );
    }
    if (s === 'out_for_delivery' || s === 'in_transit') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-100">
          <Truck className="w-3.5 h-3.5" />
          <span>Out for Delivery</span>
        </span>
      );
    }
    if (s === 'packed' || s === 'ready_for_pickup') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-[#4f46e5] border border-indigo-100">
          <Package className="w-3.5 h-3.5" />
          <span>Packed &amp; Prepared</span>
        </span>
      );
    }
    if (s === 'cancelled') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Cancelled</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
        <Clock className="w-3.5 h-3.5" />
        <span>Processing</span>
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      {/* ── Main Public Body ────────────────────────────────────────── */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* Hero Title & Intro */}
        <div className="text-center max-w-2xl mx-auto space-y-2 print:hidden">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100/80 text-indigo-700 text-xs font-bold tracking-wide mb-1">
            <Truck className="w-3.5 h-3.5" />
            <span>Public Order &amp; Dispatch Tracker</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-[-0.03em]">
            Track Your Order in Real Time
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Enter your order reference code to check current progress, warehouse packing status, and courier dispatch timeline.
          </p>
        </div>

        {/* Search Toolbar Card */}
        <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-[#f1f5f9] shadow-sm print:hidden">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={referenceInput}
                onChange={(e) => setReferenceInput(e.target.value)}
                placeholder="Enter reference (e.g. SS-2026-00001 or ORD-001)"
                className="w-full pl-12 pr-4 py-3.5 bg-[#f8fafc] border border-slate-200/90 rounded-2xl focus:ring-2 focus:ring-[#4f46e5]/30 focus:border-[#4f46e5] outline-none text-sm text-slate-800 font-semibold transition-all shadow-2xs"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold shadow-md shadow-indigo-900/10 shrink-0"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Track Order</span>
                </>
              )}
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-100 flex items-center gap-2.5 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Demo Reference Suggestions */}
          {!order && orders.length > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                Quick Examples:
              </span>
              {orders.slice(0, 4).map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => handleQuickPreset(o.referenceNumber)}
                  className="px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-[#4f46e5] text-slate-600 font-mono font-bold border border-slate-200/70 transition-colors"
                >
                  {o.referenceNumber}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Order Found View ────────────────────────────────────────── */}
        {order && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header / Summary Card */}
            <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-[#f1f5f9] shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {order.referenceNumber}
                    </h2>
                    {getOrderStatusBadge(order.orderStatus)}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Scheduled Delivery: <strong className="text-slate-700">{order.deliveryDate ? formatDate(order.deliveryDate) : 'Pending assignment'}</strong>
                  </p>
                </div>

                {/* Actions: Copy Link, Print */}
                <div className="flex items-center gap-2 print:hidden">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="btn-secondary flex items-center gap-1.5 text-xs font-bold py-2 px-3 shadow-2xs text-slate-700"
                    title="Copy direct tracking link"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="btn-secondary flex items-center gap-1.5 text-xs font-bold py-2 px-3 shadow-2xs text-slate-700"
                    title="Print tracking confirmation"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print</span>
                  </button>
                </div>
              </div>

              {/* Customer & Address Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="p-4 bg-[#f8fafc] rounded-2xl border border-slate-100 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#4f46e5] flex items-center justify-center shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Recipient</p>
                    <p className="font-extrabold text-slate-900 text-sm truncate">{order.customerName}</p>
                    {order.contact && (
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{order.contact}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-[#f8fafc] rounded-2xl border border-slate-100 flex items-start gap-3 md:col-span-2">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#4f46e5] flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Destination</p>
                    <p className="font-extrabold text-slate-900 text-sm">
                      {order.address || order.deliveryAddress || 'Glassram Central Hub / Manila'}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Fulfillment Mode: <strong className="capitalize text-slate-700">{order.orderType || 'Delivery'}</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Progress Timeline Card */}
            <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-[#f1f5f9] shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Order Status Pipeline</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Real-time status updates synced with dispatch network</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-semibold text-slate-600">Updated: {lastRefreshed.toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Progress Line and Circles */}
              <div className="w-full relative px-2 sm:px-6">
                {/* Connecting background track */}
                <div className="absolute top-5 left-8 right-8 h-1 -translate-y-1/2 bg-slate-100 z-0" />
                {/* Active progress fill */}
                <div 
                  className="absolute top-5 left-8 h-1 -translate-y-1/2 bg-[#4f46e5] z-0 transition-all duration-700 ease-out"
                  style={{ 
                    width: progressSteps.length > 1 
                      ? `calc(${Math.min(100, (currentStepIndex / (progressSteps.length - 1)) * 100)}% - 40px)` 
                      : '0%' 
                  }}
                />

                <div className="relative z-10 flex items-start justify-between w-full">
                  {progressSteps.map((step, idx) => {
                    const isCompleted = idx <= currentStepIndex;
                    const isCurrent = idx === currentStepIndex;

                    return (
                      <div key={step.key} className="flex flex-col items-center text-center flex-1">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-2xs ${
                            isCurrent
                              ? 'bg-[#4f46e5] text-white ring-4 ring-indigo-100 shadow-md shadow-indigo-900/20'
                              : isCompleted
                              ? 'bg-[#4f46e5] text-white'
                              : 'bg-white border-2 border-slate-200 text-slate-300'
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <Clock className="w-5 h-5" />
                          )}
                        </div>
                        <p
                          className={`mt-3 text-xs font-bold tracking-tight ${
                            isCurrent
                              ? 'text-[#4f46e5]'
                              : isCompleted
                              ? 'text-slate-900'
                              : 'text-slate-400'
                          }`}
                        >
                          {step.label}
                        </p>
                        <p className="text-[11px] text-slate-400 hidden sm:block mt-0.5 max-w-[120px]">
                          {step.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status Note Banner */}
              <div className="mt-8 p-4 bg-[#f8fafc] rounded-2xl border border-slate-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#4f46e5] flex items-center justify-center shrink-0">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Phase</p>
                    <p className="text-sm font-extrabold text-slate-900">
                      {order.orderStatus === 'completed' || order.orderStatus === 'delivered'
                        ? 'Order successfully completed and delivered.'
                        : order.orderStatus === 'out_for_delivery' || order.orderStatus === 'in_transit'
                        ? 'Shipment has departed Glassram Logistics Center and is en route.'
                        : order.orderStatus === 'packed' || order.orderStatus === 'ready_for_pickup'
                        ? 'Materials packed and verified. Awaiting courier departure or customer pickup.'
                        : 'Order details registered. Awaiting warehouse fulfillment.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => executeSearch(order.referenceNumber)}
                  disabled={loading}
                  className="p-2 text-slate-400 hover:text-[#4f46e5] hover:bg-indigo-50 rounded-xl transition-colors print:hidden"
                  title="Refresh status"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Order Items Breakdown & Billing Summary */}
            <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-[#f1f5f9] shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-[#4f46e5]" />
                  <span>Itemized Shipment Manifest</span>
                </h3>
                {getPaymentBadge(order.paymentStatus)}
              </div>

              <div className="divide-y divide-slate-100">
                {order.items.map((item, idx) => {
                  const name = item.productName || item.name || 'Glass/Aluminum Material';
                  const price = item.unitPrice || 0;
                  const itemTotal = item.lineTotal || item.total || (item.quantity * price);

                  return (
                    <div key={idx} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Qty: <strong className="text-slate-600">{item.quantity}</strong> × {formatCurrency(price)}
                        </p>
                      </div>
                      <span className="font-extrabold text-slate-900 text-sm whitespace-nowrap">
                        {formatCurrency(itemTotal)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Total Summary */}
              <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Order Amount</span>
                  <p className="text-2xl font-black text-[#4f46e5]">
                    {formatCurrency(order.total)}
                  </p>
                </div>

                {order.paidAmount > 0 && order.paymentStatus !== 'paid' && (
                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100/70 text-right">
                    <span className="text-[11px] font-bold text-amber-800">Amount Paid: {formatCurrency(order.paidAmount)}</span>
                    <p className="text-xs font-black text-amber-900 mt-0.5">
                      Remaining: {formatCurrency(order.total - order.paidAmount)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Warehouse Pickup Info (if applicable) */}
            {order.orderType === 'pickup' && (
              <div className="bg-indigo-50/70 rounded-[28px] p-6 sm:p-8 border border-indigo-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#4f46e5] text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-900/10">
                    <Package className="w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-base font-extrabold text-slate-900">Warehouse Self-Pickup Instructions</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Please present your reference code <strong className="text-slate-900 font-mono">{order.referenceNumber}</strong> and valid ID at the Glassram Dispatch Desk.
                    </p>
                    <div className="text-xs text-slate-600 pt-1 space-y-1">
                      <p><strong>Hub Location:</strong> Glassram Glass &amp; Aluminum Depot, Caloocan / Metro Manila</p>
                      <p><strong>Pickup Operating Hours:</strong> Monday – Saturday, 8:00 AM – 5:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Help / Guidance Cards ───────────────────────────────────── */}
        {!order && !loading && (
          <div className="bg-white rounded-[28px] p-8 border border-[#f1f5f9] shadow-sm space-y-6">
            <div className="max-w-md mx-auto text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-[#4f46e5] flex items-center justify-center mx-auto shadow-2xs">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Where can I locate my reference number?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Every SmartStock glass and aluminum purchase generates an official transaction identifier formatted like <span className="font-mono font-bold text-slate-700">SS-2026-XXXXX</span>.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="p-4 rounded-2xl bg-[#f8fafc] border border-slate-100 space-y-1.5">
                <span className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">1</span>
                <p className="text-xs font-bold text-slate-900">Invoice Receipt</p>
                <p className="text-[11px] text-slate-500">Printed on the top header of your official sales receipt or purchase voucher.</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#f8fafc] border border-slate-100 space-y-1.5">
                <span className="w-7 h-7 rounded-xl bg-indigo-50 text-[#4f46e5] flex items-center justify-center font-bold text-xs">2</span>
                <p className="text-xs font-bold text-slate-900">SMS / Email Notice</p>
                <p className="text-[11px] text-slate-500">Sent to your registered mobile phone or email upon order placement.</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#f8fafc] border border-slate-100 space-y-1.5">
                <span className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">3</span>
                <p className="text-xs font-bold text-slate-900">Driver Dispatch Note</p>
                <p className="text-[11px] text-slate-500">Displayed on the courier's digital or physical bill of lading.</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Public Footer ────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-[#f1f5f9] py-8 text-center text-xs text-slate-400 mt-auto print:hidden">
        <div className="max-w-5xl mx-auto px-4 space-y-2">
          <p className="font-bold text-slate-600">
            Glassram Glass and Aluminum Supply &bull; SmartStock Live Tracking
          </p>
          <p className="text-[11px]">
            &copy; {new Date().getFullYear()} Glassram Supply. All rights reserved. Real-time delivery and dispatch tracking network.
          </p>
          <p className="text-[11px] text-slate-400">
            Need urgent assistance? Customer Support Hotline: <strong className="text-slate-600">(02) 8123-4567</strong> (Mon–Sat 8AM–5PM)
          </p>
        </div>
      </footer>
    </div>
  );
};

export default TrackingPage;
