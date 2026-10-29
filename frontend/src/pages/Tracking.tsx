import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  CheckCircle, 
  Clock, 
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
import { apiFetch } from '../api';
import { formatCurrency, formatDate } from '../utils/helpers';
import { toast } from 'sonner';

type PublicTrackingOrder = {
  referenceNumber: string;
  customerName: string;
  deliveryAddress: string;
  deliveryDate: string;
  orderStatus: 'processing' | 'in_transit' | 'delivered' | 'cancelled';
  paymentStatus: string;
  total: number;
  paidAmount: number;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
};

export const TrackingPage: React.FC = () => {
  const { referenceNumber: urlRef } = useParams<{ referenceNumber?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryRef = searchParams.get('ref') || searchParams.get('order') || '';
  

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
      if (!backendOrder?.referenceNumber) throw new Error('Tracking service returned an invalid response.');
      setOrder(backendOrder);
      setLastRefreshed(new Date());
    } catch (err) {
      setOrder(null);
      const message = err instanceof Error ? err.message : 'Unable to load tracking information.';
      setError(message.includes('not found')
        ? `No order found with reference "${cleanRef}". Please verify and try again.`
        : `Tracking information could not be loaded: ${message}`);
    } finally {
      setLoading(false);
    }
  }, []);

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


  const handleCopyLink = () => {
    if (!order) return;
    const url = `${window.location.origin}/track/${encodeURIComponent(order.referenceNumber)}`;
    navigator.clipboard.writeText(url);
    toast.success('Tracking link copied to clipboard!');
  };

  const handlePrint = () => {
    toast.info('Opening print preview...');
    window.print();
  };

  // These steps mirror the statuses the public tracking API actually returns.
  const progressSteps = useMemo(() => [
    { key: 'processing', label: 'Processing', desc: 'Order is being prepared' },
    { key: 'in_transit', label: 'In Transit', desc: 'Order status is marked in transit' },
    { key: 'delivered', label: 'Delivered', desc: 'Order is marked delivered' },
  ], []);

  const currentStepIndex = useMemo(() => {
    if (!order) return 0;
    if (order.orderStatus === 'delivered') return progressSteps.length - 1;
    if (order.orderStatus === 'in_transit') return 1;
    if (order.orderStatus === 'processing') return 0;
    return -1;
  }, [order, progressSteps]);

  const isDelivered = useMemo(() => {
    if (!order) return false;
    return order.orderStatus === 'delivered';
  }, [order]);

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
    if (s === 'delivered') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Delivered</span>
        </span>
      );
    }
    if (s === 'in_transit') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-100">
          <Truck className="w-3.5 h-3.5" />
          <span>In Transit</span>
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
            <span>Public Order Tracker</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-[-0.03em]">
            Check Your Order Status
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            Enter your order reference to retrieve the latest status and details available for public tracking.
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
                placeholder="Enter your order reference"
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
                    Scheduled date: <strong className="text-slate-700">{formatDate(order.deliveryDate)}</strong>
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

              {/* Public-safe customer and address details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="p-4 bg-[#f8fafc] rounded-2xl border border-slate-100 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#4f46e5] flex items-center justify-center shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Recipient</p>
                    <p className="font-extrabold text-slate-900 text-sm truncate">{order.customerName}</p>
                  </div>
                </div>

                <div className="p-4 bg-[#f8fafc] rounded-2xl border border-slate-100 flex items-start gap-3 md:col-span-2">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#4f46e5] flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Address on order</p>
                    <p className="font-extrabold text-slate-900 text-sm">
                      {order.deliveryAddress || 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Backend order-status timeline */}
            <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-[#f1f5f9] shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">Order Status</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Status is read from the order record. Refresh to check for changes.</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-slate-600">Checked: {lastRefreshed.toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Progress Line and Circles */}
              <div className="w-full relative px-2 sm:px-4">
                <div className="flex items-start w-full relative">
                  {progressSteps.map((step, idx, arr) => {
                    const isCompleted = isDelivered || idx <= currentStepIndex;
                    const isCurrent = !isDelivered && idx === currentStepIndex;

                    return (
                      <div key={step.key} className="relative flex-1 flex flex-col items-center">
                        {/* Connecting line to next step */}
                        {idx < arr.length - 1 && (
                          <div className="absolute top-5 left-1/2 w-full h-1 -translate-y-1/2 bg-slate-100 z-0">
                            <div 
                              className="h-full bg-[#4f46e5] transition-all duration-500"
                              style={{ 
                                width: (isDelivered || idx < currentStepIndex) ? '100%' : '0%' 
                              }}
                            />
                          </div>
                        )}

                        <div
                          className={`relative z-10 w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-2xs ${
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
                          className={`mt-3 text-xs font-bold tracking-tight text-center px-1 leading-tight ${
                            isCurrent
                              ? 'text-[#4f46e5]'
                              : isCompleted
                              ? 'text-slate-900'
                              : 'text-slate-400'
                          }`}
                        >
                          {step.label}
                        </p>
                        <p className="text-[11px] text-slate-400 hidden sm:block mt-0.5 max-w-[130px] text-center">
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
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Status</p>
                    <p className="text-sm font-extrabold text-slate-900">
                      {order.orderStatus === 'cancelled'
                        ? 'This order is marked as cancelled.'
                        : 'The status above reflects the latest value returned for this order.'}
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
                  <span>Order Items &amp; Billing Summary</span>
                </h3>
                {getPaymentBadge(order.paymentStatus)}
              </div>

              <div className="divide-y divide-slate-100">
                {order.items.map((item, idx) => {
                  const itemTotal = item.lineTotal;

                  return (
                    <div key={idx} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{item.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Qty: <strong className="text-slate-600">{item.quantity}</strong> × {formatCurrency(item.unitPrice)}
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
                How do I check this order?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Enter the order reference provided by the store. The status and order details shown here come from the public order record.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="p-4 rounded-2xl bg-[#f8fafc] border border-slate-100 space-y-1.5">
                <span className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">1</span>
                <p className="text-xs font-bold text-slate-900">Use the reference</p>
                <p className="text-[11px] text-slate-500">Enter the exact order reference in the field above.</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#f8fafc] border border-slate-100 space-y-1.5">
                <span className="w-7 h-7 rounded-xl bg-indigo-50 text-[#4f46e5] flex items-center justify-center font-bold text-xs">2</span>
                <p className="text-xs font-bold text-slate-900">Check the returned status</p>
                <p className="text-[11px] text-slate-500">The status badge reflects the value returned by the tracking service.</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#f8fafc] border border-slate-100 space-y-1.5">
                <span className="w-7 h-7 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">3</span>
                <p className="text-xs font-bold text-slate-900">Refresh when needed</p>
                <p className="text-[11px] text-slate-500">When an order is displayed, use Refresh status to request its latest saved value.</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Public Footer ────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-[#f1f5f9] py-8 text-center text-xs text-slate-400 mt-auto print:hidden">
        <div className="max-w-5xl mx-auto px-4 space-y-2">
          <p className="font-bold text-slate-600">
            Glassram Glass and Aluminum Supply &bull; SmartStock Order Tracking
          </p>
          <p className="text-[11px]">
            &copy; {new Date().getFullYear()} Glassram Supply. All rights reserved. Status details are provided by SmartStock order records.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default TrackingPage;
