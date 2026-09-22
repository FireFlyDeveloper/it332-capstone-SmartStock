import React, { useState, useMemo } from 'react';
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
  X,
} from 'lucide-react';
import { useData } from '../components/DataContext';
import type { Delivery } from '../types';
import { getStatusColor } from '../utils/helpers';
import { toCSV, downloadCSV } from '../utils/csv';
import { toast } from 'sonner';

const deliverySteps = [
  { key: 'pending', label: 'Placed', icon: Package },
  { key: 'assigned', label: 'Assigned', icon: User },
  { key: 'picked_up', label: 'Picked Up', icon: Package },
  { key: 'in_transit', label: 'In Transit', icon: Truck },
  { key: 'arrived', label: 'Arrived', icon: MapPin },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle },
];

export const DeliveryPage: React.FC = () => {
  const { deliveries, orders, updateDeliveryStatus, loading } = useData();
  
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'in_transit' | 'delivered'>('all');

  const filteredDeliveries = useMemo(() => {
    return deliveries.filter(d => {
      if (filterStatus === 'all') return true;
      if (filterStatus === 'in_transit') return ['assigned', 'picked_up', 'in_transit', 'arrived'].includes(d.status);
      return d.status === filterStatus;
    });
  }, [deliveries, filterStatus]);

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
      <div className="space-y-6 animate-fadeIn">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-[24px] shadow-sm border border-[#f1f5f9] p-5 micro-hover">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Total Deliveries</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{deliveries.length}</p>
          </div>
          <div className="bg-white rounded-[24px] shadow-sm border border-[#f1f5f9] p-5 micro-hover">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Pending</p>
            <p className="text-2xl font-black text-[#f59e0b] mt-1">{deliveries.filter(d => d.status === 'pending').length}</p>
          </div>
          <div className="bg-white rounded-[24px] shadow-sm border border-[#f1f5f9] p-5 micro-hover">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">In Transit</p>
            <p className="text-2xl font-black text-[#3b82f6] mt-1">{deliveries.filter(d => ['assigned', 'picked_up', 'in_transit', 'arrived'].includes(d.status)).length}</p>
          </div>
          <div className="bg-white rounded-[24px] shadow-sm border border-[#f1f5f9] p-5 micro-hover">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Delivered</p>
            <p className="text-2xl font-black text-[#10b981] mt-1">{deliveries.filter(d => d.status === 'delivered').length}</p>
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
                className={`rounded-2xl px-4 py-1.5 text-xs font-bold transition-all ${
                  filterStatus === pill.key
                    ? 'bg-[#4f46e5] text-white shadow-md shadow-indigo-900/20'
                    : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
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
            className="inline-flex items-center gap-2 self-start rounded-2xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>

        {/* Deliveries Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredDeliveries.map((delivery) => {
            const order = orders.find(o => o.id === delivery.orderId);
            const currentStep = getStepIndex(delivery.status);
            const isDelivered = delivery.status === 'delivered';
            const isFailed = delivery.status === 'failed';
            
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
                        <h3 className="font-extrabold text-slate-900 truncate">{delivery.id}</h3>
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
                    {order && (
                      <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100/80">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-xs text-slate-900 truncate">{order.customerName}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                            <Phone className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                            <span className="truncate">{order.contact}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Destination & Driver info */}
                    <div className="space-y-2 text-xs">
                      <div className="flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Destination</p>
                          <p className="font-semibold text-slate-800 truncate">{delivery.destination}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5 truncate">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate font-medium">{delivery.driver}</span>
                        </span>
                        <span className="font-bold text-slate-700 shrink-0 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                          {delivery.truckNumber}
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
                    {!isDelivered && !isFailed ? (
                      <div className="space-y-2">
                        {getNextStatus(delivery.status) && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(delivery.id)}
                            className="w-full btn-primary flex items-center justify-center gap-2 py-2.5 text-xs font-bold"
                          >
                            <ChevronRight className="w-4 h-4" />
                            Mark as {getNextStatus(delivery.status)?.replace('_', ' ')}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            updateDeliveryStatus(delivery.id, 'failed', -1);
                            toast.error('Delivery marked as failed');
                          }}
                          className="w-full text-rose-600 hover:bg-rose-50 py-1.5 rounded-xl text-xs font-bold transition-colors"
                        >
                          Mark as Failed
                        </button>
                      </div>
                    ) : isDelivered ? (
                      <div className="py-2.5 px-3 bg-emerald-50 rounded-2xl flex items-center justify-center gap-2 text-xs font-extrabold text-emerald-700">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>Successfully Delivered</span>
                      </div>
                    ) : (
                      <div className="py-2.5 px-3 bg-rose-50 rounded-2xl flex items-center justify-center gap-2 text-xs font-extrabold text-rose-700">
                        <X className="w-4 h-4 text-rose-600" />
                        <span>Delivery Failed</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredDeliveries.length === 0 && !isEmpty && (
            <div className="col-span-full p-12 text-center">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No deliveries match the current filter.</p>
            </div>
          )}

          {isEmpty && (
            <div className="col-span-full p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                <Truck className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">No deliveries scheduled</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
                Demo data will appear once the backend is connected. The delivery list updates
                automatically as orders move through the pipeline.
              </p>
            </div>
          )}
        </div>
      </div>
  );
};