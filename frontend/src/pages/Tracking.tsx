import React, { useState, useMemo } from 'react';
import { Search, Package, CheckCircle, Clock, Phone, User, Home, ShoppingBag } from 'lucide-react';
import { useData } from '../components/DataContext';
import type { Order } from '../types';
import { formatCurrency } from '../utils/helpers';
import { toast } from 'sonner';

const TrackingPage: React.FC = () => {
  const { orders } = useData();
  const [referenceNumber, setReferenceNumber] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = () => {
    if (!referenceNumber.trim()) {
      setError('Please enter a reference number');
      return;
    }

    setLoading(true);
    setError('');
    setOrder(null);

    // TODO(backend): swap for `apiFetch<Order>(`/orders/${encodeURIComponent(referenceNumber)}`)`
    // once the Hono backend exposes a lookup endpoint. For now we search the
    // already-fetched list in memory.
    setTimeout(() => {
      const foundOrder = orders.find(
        (o: Order) =>
          o.referenceNumber.toLowerCase() === referenceNumber.trim().toLowerCase() ||
          o.id.toLowerCase() === referenceNumber.trim().toLowerCase(),
      );

      if (foundOrder) {
        setOrder(foundOrder);
        toast.success('Order found!');
      } else {
        setError('Order not found. Please check your reference number.');
        toast.error('Order not found');
      }
      setLoading(false);
    }, 500);
  };

  // Calculate order progress based on status
  const getProgressSteps = useMemo(() => {
    if (!order) return [];

    if (order.orderType === 'pickup') {
      // Pickup flow: Pending → Ready for Pickup → Completed
      return [
        { key: 'pending', label: 'Order Placed', status: 'pending' as const },
        { key: 'ready_for_pickup', label: 'Ready for Pickup', status: 'ready_for_pickup' as const },
        { key: 'completed', label: 'Completed/Picked Up', status: 'completed' as const }
      ];
    } else {
      // Delivery flow: Pending → Packed → Out for Delivery → Delivered
      return [
        { key: 'pending', label: 'Order Placed', status: 'pending' as const },
        { key: 'packed', label: 'Packed', status: 'packed' as const },
        { key: 'out_for_delivery', label: 'Out for Delivery', status: 'out_for_delivery' as const },
        { key: 'delivered', label: 'Delivered', status: 'completed' as const }
      ];
    }
  }, [order]);

  const getCurrentStepIndex = useMemo(() => {
    if (!order) return -1;
    
    const statusOrder = ['pending', 'ready_for_pickup', 'packed', 'out_for_delivery', 'completed'];
    return statusOrder.indexOf(order.orderStatus);
  }, [order]);

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-700';
      case 'partial': return 'bg-yellow-100 text-yellow-700';
      case 'pending': return 'bg-gray-100 text-gray-700';
      case 'refunded': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Track Your Order</h1>
          <p className="text-gray-600">Enter your reference number to track your order status</p>
        </div>

        {/* Search Box */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Enter reference number (e.g., SS-2024-00001)"
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
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
          {error && (
            <p className="mt-3 text-red-600 text-sm">{error}</p>
          )}
        </div>

        {/* Results */}
        {order && (
          <div className="space-y-6">
            {/* Order Info Card */}
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

              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <User className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-500">Customer</p>
                    <p className="font-medium text-gray-900">{order.customerName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-gray-500">Contact</p>
                    <p className="font-medium text-gray-900">{order.contact}</p>
                  </div>
                </div>
                {order.orderType === 'delivery' && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl md:col-span-2">
                    <Home className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-500">Delivery Address</p>
                      <p className="font-medium text-gray-900">{order.address}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="border-t border-gray-100 pt-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" />
                  Order Items
                </h3>
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{item.productName}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity} × {formatCurrency(item.unitPrice)}</p>
                      </div>
                      <span className="font-semibold text-gray-900">{formatCurrency(item.total)}</span>
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

            {/* Progress Timeline */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Order Progress</h3>
              
              {/* Steps */}
              <div className="flex items-center justify-between relative">
                {/* Progress Line */}
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2" />
                <div 
                  className="absolute top-1/2 left-0 h-1 bg-blue-600 -translate-y-1/2 transition-all duration-500"
                  style={{ width: `${(getCurrentStepIndex / (getProgressSteps.length - 1)) * 100}%` }}
                />
                
                {getProgressSteps.map((step, index) => {
                  const isCompleted = index <= getCurrentStepIndex;
                  const isCurrent = index === getCurrentStepIndex;
                  
                  return (
                    <div key={step.key} className="relative flex flex-col items-center z-10">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isCompleted 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-200 text-gray-400'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <Clock className="w-5 h-5" />
                        )}
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

              {/* Current Status */}
              <div className="mt-8 p-4 bg-blue-50 rounded-xl text-center">
                <p className="text-sm text-blue-600 mb-1">Current Status</p>
                <p className="text-lg font-bold text-blue-900">
                  {order.orderStatus === 'pending' && 'Order Placed - Awaiting Confirmation'}
                  {order.orderStatus === 'ready_for_pickup' && 'Ready for Pickup'}
                  {order.orderStatus === 'packed' && 'Order Packed - Ready for Delivery'}
                  {order.orderStatus === 'out_for_delivery' && 'Out for Delivery'}
                  {order.orderStatus === 'completed' && 'Order Completed'}
                  {order.orderStatus === 'cancelled' && 'Order Cancelled'}
                </p>
              </div>
            </div>

            {/* Pickup Info (if applicable) */}
            {order.orderType === 'pickup' && order.orderStatus !== 'completed' && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Pickup Information
                </h3>
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-sm text-blue-600 mb-2">
                    Please bring your confirmation and proceed to our warehouse to pick up your order.
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Pickup Location:</strong> Glassram Warehouse, Manila
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Business Hours:</strong> Mon-Sat 8:00 AM - 6:00 PM
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
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