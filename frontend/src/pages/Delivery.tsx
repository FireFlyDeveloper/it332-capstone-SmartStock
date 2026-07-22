import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Truck,
  MapPin,
  Phone,
  Package,
  User,
  ChevronRight,
  CheckCircle,
  Circle,
  Loader,
  Download,
  Search,
} from 'lucide-react';
import { useData } from '../components/DataContext';
import type { Delivery } from '../types';
import { getStatusColor } from '../utils/helpers';
import { toCSV, downloadCSV } from '../utils/csv';
import { toast } from 'sonner';

const PAGE_SIZE = 18;

const deliverySteps = [
  { key: 'pending', label: 'Order Placed', icon: Package },
  { key: 'assigned', label: 'Driver Assigned', icon: User },
  { key: 'picked_up', label: 'Picked Up', icon: Package },
  { key: 'in_transit', label: 'In Transit', icon: Truck },
  { key: 'arrived', label: 'Arrived', icon: MapPin },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle }
];

export const DeliveryPage: React.FC = () => {
  const { deliveries, orders, updateDeliveryStatus, loading } = useData();
  
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in_transit' | 'delivered'>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter(d => {
      if (filterStatus === 'all') return true;
      if (filterStatus === 'in_transit') return ['assigned', 'picked_up', 'in_transit', 'arrived'].includes(d.status);
      return d.status === filterStatus;
    });
  }, [deliveries, filterStatus]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filterStatus]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisibleCount((count) => Math.min(count + PAGE_SIZE, filteredDeliveries.length));
      }
    }, { rootMargin: '420px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, [filteredDeliveries.length]);

  const visibleDeliveries = filteredDeliveries.slice(0, visibleCount);
  const hasMoreDeliveries = visibleDeliveries.length < filteredDeliveries.length;

  const getNextStatus = (currentStatus: Delivery['status']): Delivery['status'] | null => {
    const flow: Record<Delivery['status'], Delivery['status'] | null> = {
      pending: 'assigned',
      assigned: 'picked_up',
      picked_up: 'in_transit',
      in_transit: 'arrived',
      arrived: 'delivered',
      delivered: null,
      failed: null
    };
    return flow[currentStatus];
  };

  const getStepIndex = (status: Delivery['status']): number => {
    const statusMap: Record<Delivery['status'], number> = {
      pending: 0,
      assigned: 1,
      picked_up: 2,
      in_transit: 3,
      arrived: 4,
      delivered: 5,
      failed: -1
    };
    return statusMap[status] ?? 0;
  };

  const handleUpdateStatus = (deliveryId: string) => {
    const delivery = deliveries.find(d => d.id === deliveryId);
    if (!delivery) return;

    const nextStatus = getNextStatus(delivery.status);
    if (nextStatus) {
      const nextStep = getStepIndex(nextStatus);
      updateDeliveryStatus(deliveryId, nextStatus, nextStep);
      toast.success(`Delivery status updated to ${nextStatus.replace('_', ' ')}`);
    }
  };

  const handleExportCSV = () => {
    const rows = filteredDeliveries.map((d) => {
      const order = orders.find((o) => o.id === d.orderId);
      return {
        id: d.id,
        orderId: d.orderId,
        customer: order?.customerName ?? '',
        destination: d.destination,
        driver: d.driver,
        truckNumber: d.truckNumber,
        status: d.status,
        trafficLevel: d.trafficLevel,
        predictedDelay: d.predictedDelay ? 'yes' : 'no',
        routeEfficiency: d.routeEfficiencyScore,
      };
    });
    const csv = toCSV(rows, [
      { key: 'id', header: 'Delivery ID' },
      { key: 'orderId', header: 'Order ID' },
      { key: 'customer', header: 'Customer' },
      { key: 'destination', header: 'Destination' },
      { key: 'driver', header: 'Driver' },
      { key: 'truckNumber', header: 'Truck' },
      { key: 'status', header: 'Status' },
      { key: 'trafficLevel', header: 'Traffic' },
      { key: 'predictedDelay', header: 'Predicted Delay' },
      { key: 'routeEfficiency', header: 'Route Efficiency' },
    ]);
    downloadCSV(`deliveries-${new Date().toISOString().split('T')[0]}.csv`, csv);
    toast.success(`Exported ${filteredDeliveries.length} deliveries to CSV`);
  };

  const statusPills: { key: typeof filterStatus; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'in_transit', label: 'In Transit' },
    { key: 'delivered', label: 'Delivered' },
  ];

  const isEmpty = !loading && deliveries.length === 0;

  return (
      <div className="page-stack animate-fadeIn">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="metric-card p-4">
            <p className="text-sm text-text-muted">Total Deliveries</p>
            <p className="text-2xl font-bold text-text">{deliveries.length}</p>
          </div>
          <div className="metric-card p-4">
            <p className="text-sm text-text-muted">Pending</p>
            <p className="text-2xl font-bold text-accent">{deliveries.filter(d => d.status === 'pending').length}</p>
          </div>
          <div className="metric-card p-4">
            <p className="text-sm text-text-muted">In Transit</p>
            <p className="text-2xl font-bold text-accent">{deliveries.filter(d => ['assigned', 'picked_up', 'in_transit', 'arrived'].includes(d.status)).length}</p>
          </div>
          <div className="metric-card p-4">
            <p className="text-sm text-text-muted">Delivered</p>
            <p className="text-2xl font-bold text-[var(--success)]">{deliveries.filter(d => d.status === 'delivered').length}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {statusPills.map((pill) => (
              <button
                key={pill.key}
                type="button"
                onClick={() => setFilterStatus(pill.key)}
                className={`rounded-[var(--radius-pill)] px-3 py-1 text-xs font-medium transition-colors ${
                  filterStatus === pill.key
                    ? 'bg-accent text-accent-fg'
                    : 'bg-surface-2 text-text-muted hover:bg-[var(--surface-3)]'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredDeliveries.length === 0}
            className="btn-secondary gap-2 self-start disabled:opacity-50 sm:self-auto"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>

        {/* Deliveries Grid */}
        <div className="grid grid-cols-1 gap-4">
          {visibleDeliveries.map((delivery) => {
            const order = orders.find(o => o.id === delivery.orderId);
            const currentStep = getStepIndex(delivery.status);
            
            return (
              <div 
                key={delivery.id}
                className="metric-card overflow-hidden"
              >
                {/* Header */}
                <div className="p-5 border-b border-border bg-surface-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-accent-soft rounded-[var(--radius-input)]">
                        <Truck className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-text">{delivery.id}</h3>
                        <p className="text-sm text-text-muted">Order: {delivery.orderId}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-[var(--radius-pill)] text-sm font-medium ${getStatusColor(delivery.status)}`}>
                      {delivery.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                  {/* Customer Info */}
                  {order && (
                    <div className="flex items-start gap-3 p-3 bg-surface-2 rounded-[var(--radius-input)]">
                      <div className="flex-1">
                        <p className="font-medium text-text">{order.customerName}</p>
                        <div className="flex items-center gap-2 mt-1 text-sm text-text-muted">
                          <Phone className="w-4 h-4" />
                          <span>{order.contact}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Destination */}
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-text-subtle mt-0.5" />
                    <div>
                      <p className="text-sm text-text-muted">Destination</p>
                      <p className="font-medium text-text">{delivery.destination}</p>
                    </div>
                  </div>

                  {/* Progress Timeline */}
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm font-medium text-text-muted mb-3">Delivery Progress</p>
                    <div className="flex items-center justify-between">
                      {deliverySteps.map((step, index) => {
                        const isCompleted = index <= currentStep;
                        const isCurrent = index === currentStep;
                        const isTerminal = delivery.status === 'delivered' || delivery.status === 'failed';
                        
                        return (
                          <div key={step.key} className="flex flex-col items-center">
                            <div className={`
                              w-8 h-8 rounded-[var(--radius-pill)] flex items-center justify-center
                              ${isCompleted ? 'bg-accent text-accent-fg' : 'bg-surface-2 text-text-subtle'}
                              ${isCurrent && !isTerminal ? 'ring-4 ring-accent-soft' : ''}
                            `}>
                              {isCurrent && !isTerminal ? (
                                <Loader className="w-4 h-4 animate-spin" />
                              ) : isCompleted ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : (
                                <Circle className="w-4 h-4" />
                              )}
                            </div>
                            <span className={`text-xs mt-1 hidden sm:block ${isCompleted ? 'text-text' : 'text-text-subtle'}`}>
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  {delivery.status !== 'delivered' && delivery.status !== 'failed' && (
                    <div className="pt-4">
                      {getNextStatus(delivery.status) && (
                        <button
                          onClick={() => handleUpdateStatus(delivery.id)}
                          className="w-full btn-primary flex items-center justify-center gap-2"
                        >
                          <ChevronRight className="w-5 h-5" />
                          Mark as {getNextStatus(delivery.status)?.replace('_', ' ')}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          updateDeliveryStatus(delivery.id, 'failed', -1);
                          toast.error('Delivery marked as failed');
                        }}
                        className="w-full mt-2 text-danger hover:bg-danger-soft py-2 rounded-[var(--radius-input)] transition-colors"
                      >
                        Mark as Failed
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {hasMoreDeliveries && (
            <div ref={loadMoreRef} className="empty-state py-5 text-sm">
              Loading more deliveries · {visibleDeliveries.length} of {filteredDeliveries.length}
            </div>
          )}

          {!hasMoreDeliveries && filteredDeliveries.length > PAGE_SIZE && (
            <div className="py-4 text-center text-xs text-text-subtle">
              Showing all {filteredDeliveries.length} deliveries
            </div>
          )}

          {filteredDeliveries.length === 0 && !isEmpty && (
            <div className="col-span-full p-12 text-center">
              <Search className="w-12 h-12 text-text-subtle mx-auto mb-4" />
              <p className="text-text-muted">No deliveries match the current filter.</p>
            </div>
          )}

          {isEmpty && (
            <div className="col-span-full p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[var(--radius-pill)] bg-surface-2">
                <Truck className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-text">No deliveries scheduled</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-text-muted">
                Demo data will appear once the backend is connected. The delivery list updates
                automatically as orders move through the pipeline.
              </p>
            </div>
          )}
        </div>
      </div>
  );
};