import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Truck,
  MapPin,
  Phone,
  Package,

  ChevronRight,
  CheckCircle,
  Circle,
  Loader,
  Download,
  Search,
} from 'lucide-react';
import { useData } from '../components/DataContext';
import { getDeliveriesPage, type DeliveryPageItem } from '../api';
import type { Delivery } from '../types';
import { getStatusColor } from '../utils/helpers';
import { toCSV, downloadCSV } from '../utils/csv';
import { toast } from 'sonner';

const deliverySteps = [
  { key: 'pending', label: 'Pending', icon: Package },
  { key: 'in_transit', label: 'In Transit', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle },
];

export const DeliveryPage: React.FC = () => {
  const { updateOrder } = useData();
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in_transit' | 'delivered'>('all');
  const [pageItems, setPageItems] = useState<DeliveryPageItem[]>([]);
  const [pageNextCursor, setPageNextCursor] = useState<string | null>(null);
  const [pageHasMore, setPageHasMore] = useState(false);
  const [pageTotalCount, setPageTotalCount] = useState(0);
  const [pageSummary, setPageSummary] = useState({ totalCount: 0, pendingCount: 0, inTransitCount: 0, deliveredCount: 0 });
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingMoreError, setLoadingMoreError] = useState('');
  const [exportingCsv, setExportingCsv] = useState(false);
  const pageGeneration = useRef(0);
  const loadingMoreRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const pageSize = 25;

  const loadFirstPage = useCallback(async () => {
    const requestId = ++pageGeneration.current;
    loadingMoreRef.current = false;
    setPageLoading(true);
    setLoadingMore(false);
    setPageError('');
    setLoadingMoreError('');
    setPageItems([]);
    setPageNextCursor(null);
    setPageHasMore(false);
    setPageTotalCount(0);
    setPageSummary({ totalCount: 0, pendingCount: 0, inTransitCount: 0, deliveredCount: 0 });
    try {
      const result = await getDeliveriesPage({ limit: pageSize, status: filterStatus });
      if (requestId !== pageGeneration.current) return;
      setPageItems(result.items);
      setPageNextCursor(result.page.nextCursor);
      setPageHasMore(result.page.hasMore);
      setPageTotalCount(result.page.totalCount);
      setPageSummary(result.summary);
    } catch (error) {
      if (requestId === pageGeneration.current) setPageError(error instanceof Error ? error.message : 'Could not load delivery page.');
    } finally {
      if (requestId === pageGeneration.current) setPageLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { void loadFirstPage() }, [loadFirstPage]);

  const loadMore = useCallback(async () => {
    if (!pageHasMore || !pageNextCursor || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    setLoadingMoreError('');
    const requestId = pageGeneration.current;
    try {
      const result = await getDeliveriesPage({ limit: pageSize, cursor: pageNextCursor, status: filterStatus });
      if (requestId !== pageGeneration.current) return;
      setPageItems((current) => [...current, ...result.items]);
      setPageNextCursor(result.page.nextCursor);
      setPageHasMore(result.page.hasMore);
      setPageTotalCount(result.page.totalCount);
      setPageSummary(result.summary);
    } catch (error) {
      if (requestId === pageGeneration.current) setLoadingMoreError(error instanceof Error ? error.message : 'Could not load more deliveries.');
    } finally {
      loadingMoreRef.current = false;
      if (requestId === pageGeneration.current) setLoadingMore(false);
    }
  }, [pageHasMore, pageNextCursor, filterStatus]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !pageHasMore || pageLoading || loadingMore || loadingMoreError || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) void loadMore();
    }, { rootMargin: '320px 0px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [pageHasMore, pageLoading, loadingMore, loadingMoreError, loadMore]);

  const getNextStatus = (currentStatus: Delivery['status']): Delivery['status'] | null => {
    if (currentStatus === 'pending') return 'in_transit';
    if (currentStatus === 'in_transit') return 'delivered';
    return null;
  };

  const getStepIndex = (status: Delivery['status']): number => {
    const statusMap: Partial<Record<Delivery['status'], number>> = {
      pending: 0,
      in_transit: 1,
      delivered: 2,
    };
    return statusMap[status] ?? -1;
  };

  const handleUpdateStatus = async (delivery: DeliveryPageItem) => {
    const nextStatus = getNextStatus(delivery.status);
    if (!nextStatus) return;
    const orderStatus = nextStatus === 'in_transit' ? 'out_for_delivery' : 'completed';
    try {
      await updateOrder(delivery.orderId, { orderStatus });
      await loadFirstPage();
      toast.success(`Delivery status updated to ${nextStatus.replace('_', ' ')}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update delivery status.');
    }
  };

  const handleExportCSV = async () => {
    setExportingCsv(true);
    try {
      const deliveriesForExport: DeliveryPageItem[] = [];
      let cursor: string | null = null;
      do {
        const result = await getDeliveriesPage({ limit: 100, cursor, status: filterStatus });
        deliveriesForExport.push(...result.items);
        cursor = result.page.nextCursor;
      } while (cursor);

      const rows = deliveriesForExport.map((delivery) => ({
        id: delivery.id,
        orderId: delivery.orderId,
        customer: delivery.customerName,
        destination: delivery.destination ?? '',
        truckNumber: delivery.truckNumber ?? '',
        status: delivery.status,
        trafficLevel: delivery.trafficLevel ?? '',
        predictedDelay: delivery.predictedDelay == null ? '' : delivery.predictedDelay ? 'yes' : 'no',
        routeEfficiency: delivery.routeEfficiencyScore ?? '',
      }));
      const csv = toCSV(rows, [
        { key: 'id', header: 'Delivery ID' },
        { key: 'orderId', header: 'Order ID' },
        { key: 'customer', header: 'Customer' },
        { key: 'destination', header: 'Destination' },
        { key: 'truckNumber', header: 'Truck' },
        { key: 'status', header: 'Status' },
        { key: 'trafficLevel', header: 'Traffic' },
        { key: 'predictedDelay', header: 'Predicted Delay' },
        { key: 'routeEfficiency', header: 'Route Efficiency' },
      ]);
      downloadCSV(`deliveries-${new Date().toISOString().split('T')[0]}.csv`, csv);
      toast.success(`Exported ${deliveriesForExport.length} deliveries to CSV`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not export deliveries.');
    } finally {
      setExportingCsv(false);
    }
  };

  const hasNoDeliveries = !pageLoading && pageSummary.totalCount === 0;
  const hasNoFilterMatches = !pageLoading && pageSummary.totalCount > 0 && pageTotalCount === 0;

  if (pageLoading) {
    return <div role="status" className="rounded-3xl bg-white p-8 text-center text-slate-600">Loading delivery data from backend…</div>;
  }
  if (pageError) {
    return (
      <div role="alert" className="rounded-3xl border border-rose-200 bg-white p-8 text-center">
        <p className="font-semibold text-rose-700">Could not load deliveries from backend: {pageError}</p>
        <button type="button" onClick={() => void loadFirstPage()} className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Retry</button>
      </div>
    );
  }

  return (
      <div className="space-y-6 animate-fadeIn">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-[24px] shadow-sm border border-[#f1f5f9] p-5 micro-hover">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Delivery Orders</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{pageSummary.totalCount}</p>
          </div>
          <div className="bg-white rounded-[24px] shadow-sm border border-[#f1f5f9] p-5 micro-hover">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Pending</p>
            <p className="text-2xl font-black text-[#f59e0b] mt-1">{pageSummary.pendingCount}</p>
          </div>
          <div className="bg-white rounded-[24px] shadow-sm border border-[#f1f5f9] p-5 micro-hover">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">In Transit</p>
            <p className="text-2xl font-black text-[#3b82f6] mt-1">{pageSummary.inTransitCount}</p>
          </div>
          <div className="bg-white rounded-[24px] shadow-sm border border-[#f1f5f9] p-5 micro-hover">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Delivered</p>
            <p className="text-2xl font-black text-[#10b981] mt-1">{pageSummary.deliveredCount}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            Status
            <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value as typeof filterStatus)} className="input w-44">
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="in_transit">In Transit</option>
              <option value="delivered">Delivered</option>
            </select>
          </label>
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={pageTotalCount === 0 || exportingCsv}
            className="inline-flex items-center gap-2 self-start rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
          >
            <Download className="h-4 w-4" /> {exportingCsv ? 'Exporting…' : 'Export CSV'}
          </button>
        </div>

        {/* Deliveries Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {pageItems.map((delivery) => {
            const currentStep = getStepIndex(delivery.status);
            const isDelivered = delivery.status === 'delivered';

            
            return (
              <div 
                key={delivery.id}
                className="bg-white rounded-[28px] shadow-sm border border-[#f1f5f9] overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                {/* Header */}
                <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-indigo-50/40 via-white to-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-[#4f46e5] flex items-center justify-center shrink-0">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-extrabold text-slate-900 truncate">{delivery.referenceNumber || delivery.id}</h3>
                        <p className="text-xs text-slate-400 truncate">Order: {delivery.orderId}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${getStatusColor(delivery.status)}`}>
                      {delivery.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3.5">
                    {/* Customer Info */}
                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100/80">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs text-slate-900 truncate">{delivery.customerName}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                          <Phone className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                          <span className="truncate">{delivery.customerPhone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Destination and vehicle details */}
                    <div className="space-y-2 text-xs">
                      <div className="flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Destination</p>
                          <p className="font-semibold text-slate-800 truncate">{delivery.destination || 'Address not provided'}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-end pt-2 border-t border-slate-100 text-xs text-slate-500">
                        <span className="font-bold text-slate-700 shrink-0 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                          {delivery.truckNumber || 'Not assigned'}
                        </span>
                      </div>
                    </div>

                    {/* Progress Timeline */}
                    <div className="pt-3 border-t border-slate-100">
                      <p className="text-xs font-bold text-slate-700 mb-3">Delivery Progress</p>
                      <div className="flex items-start w-full relative">
                        {deliverySteps.map((step, index, arr) => {
                          const isCompleted = isDelivered || index <= currentStep;
                          const isCurrent = !isDelivered && index === currentStep;
                          
                          return (
                            <div key={step.key} className="relative flex-1 flex flex-col items-center">
                              {/* Connecting line to next step */}
                              {index < arr.length - 1 && (
                                <div className="absolute top-3.5 left-1/2 w-full h-0.5 -translate-y-1/2 bg-slate-200 z-0">
                                  <div
                                    className="h-full bg-[#4f46e5] transition-all duration-500"
                                    style={{ width: (isDelivered || index < currentStep) ? '100%' : '0%' }}
                                  />
                                </div>
                              )}

                              <div className={`
                                relative z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all
                                ${isCompleted ? 'bg-[#4f46e5] text-white shadow-2xs' : 'bg-slate-200 text-slate-400'}
                                ${isCurrent ? 'ring-4 ring-indigo-100' : ''}
                              `}>
                                {isCurrent ? (
                                  <Loader className="w-3.5 h-3.5 animate-spin" />
                                ) : isCompleted ? (
                                  <CheckCircle className="w-3.5 h-3.5" />
                                ) : (
                                  <Circle className="w-3.5 h-3.5" />
                                )}
                              </div>
                              <span className={`text-[10px] mt-1.5 text-center leading-tight px-0.5 ${
                                isCurrent ? 'text-indigo-600 font-bold' : isCompleted ? 'text-slate-900 font-semibold' : 'text-slate-400'
                              }`}>
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Actions / Status Footer */}
                  <div className="pt-3 border-t border-slate-100 mt-2">
                    {!isDelivered ? (
                      <div className="space-y-2">
                        {getNextStatus(delivery.status) && (
                          <button
                            type="button"
                            onClick={() => void handleUpdateStatus(delivery)}
                            className="w-full btn-primary flex items-center justify-center gap-2 py-2.5 text-xs font-bold"
                          >
                            <ChevronRight className="w-4 h-4" />
                            Mark as {getNextStatus(delivery.status)?.replace('_', ' ')}
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="py-2.5 px-3 bg-emerald-50 rounded-2xl flex items-center justify-center gap-2 text-xs font-extrabold text-emerald-700">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>Successfully Delivered</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {hasNoFilterMatches && (
            <div className="col-span-full p-12 text-center">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No deliveries match the current filter.</p>
            </div>
          )}

          {hasNoDeliveries && (
            <div className="col-span-full p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                <Truck className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">No delivery orders</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
                Delivery orders will appear here from backend order status.
              </p>
            </div>
          )}
        </div>
        {pageHasMore && <div ref={sentinelRef} role="status" className="py-3 text-center text-xs text-slate-400">{loadingMore ? 'Loading more deliveries…' : 'Scroll to load more deliveries…'}</div>}
        {loadingMoreError && (
          <div role="alert" className="flex items-center justify-center gap-3 py-3 text-sm text-rose-700">
            <span>{loadingMoreError}</span>
            <button type="button" onClick={() => void loadMore()} className="font-semibold underline">Retry</button>
          </div>
        )}
        {!pageHasMore && pageItems.length > 0 && <p className="py-3 text-center text-xs text-slate-400">Showing all {pageTotalCount} matching deliveries</p>}
      </div>
  );
};