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
} from 'lucide-react';
import { useData } from '../components/DataContext';
import { Layout } from '../components/Layout';
import type { Delivery } from '../types';
import { getStatusColor } from '../utils/helpers';
import { toCSV, downloadCSV } from '../utils/csv';
import { toast } from 'sonner';

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
    <Layout>
      <div className="space-y-6 animate-fadeIn">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">Total Deliveries</p>
            <p className="text-2xl font-bold text-gray-900">{deliveries.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{deliveries.filter(d => d.status === 'pending').length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">In Transit</p>
            <p className="text-2xl font-bold text-blue-600">{deliveries.filter(d => ['assigned', 'picked_up', 'in_transit', 'arrived'].includes(d.status)).length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">Delivered</p>
            <p className="text-2xl font-bold text-green-600">{deliveries.filter(d => d.status === 'delivered').length}</p>
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
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  filterStatus === pill.key
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
            className="inline-flex items-center gap-2 self-start rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>

        {/* Deliveries Grid */}
        <div className="grid grid-cols-1 gap-4">
          {filteredDeliveries.map((delivery) => {
            const order = orders.find(o => o.id === delivery.orderId);
            const currentStep = getStepIndex(delivery.status);
            
            return (
              <div 
                key={delivery.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary-100 rounded-lg">
                        <Truck className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{delivery.id}</h3>
                        <p className="text-sm text-gray-500">Order: {delivery.orderId}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(delivery.status)}`}>
                      {delivery.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                  {/* Customer Info */}
                  {order && (
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{order.customerName}</p>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                          <Phone className="w-4 h-4" />
                          <span>{order.contact}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Destination */}
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">Destination</p>
                      <p className="font-medium text-gray-900">{delivery.destination}</p>
                    </div>
                  </div>

                  {/* Progress Timeline */}
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-700 mb-3">Delivery Progress</p>
                    <div className="flex items-center justify-between">
                      {deliverySteps.map((step, index) => {
                        const isCompleted = index <= currentStep;
                        const isCurrent = index === currentStep;
                        
                        return (
                          <div key={step.key} className="flex flex-col items-center">
                            <div className={`
                              w-8 h-8 rounded-full flex items-center justify-center
                              ${isCompleted ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-400'}
                              ${isCurrent ? 'ring-4 ring-primary-100' : ''}
                            `}>
                              {isCurrent ? (
                                <Loader className="w-4 h-4 animate-spin" />
                              ) : isCompleted ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : (
                                <Circle className="w-4 h-4" />
                              )}
                            </div>
                            <span className={`text-xs mt-1 hidden sm:block ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
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
                        className="w-full mt-2 text-red-600 hover:bg-red-50 py-2 rounded-lg transition-colors"
                      >
                        Mark as Failed
                      </button>
                    </div>
                  )}
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
    </Layout>
  );
};