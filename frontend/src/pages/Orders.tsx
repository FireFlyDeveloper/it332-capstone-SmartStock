import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Package,
  Truck,
  X,
  Phone,
  Clock,
  MapPin,
  Printer,
  FileText,
  Edit3,
  AlertTriangle,
  ChevronRight,
  CheckCircle,
  Circle,
  DollarSign,
  RotateCcw,
  Download,
  ShoppingBag,
} from 'lucide-react';
import { useData } from '../components/DataContext';
import { Layout } from '../components/Layout';
import type { Order, OrderItem } from '../types';
import { formatCurrency, formatDate, getStatusColor } from '../utils/helpers';
import { toCSV, downloadCSV } from '../utils/csv';
import { toast } from 'sonner';

// ── Order progress steps ──────────────────────────────────────────
const pickupSteps = [
  { key: 'pending', label: 'Order Placed' },
  { key: 'ready_for_pickup', label: 'Ready for Pickup' },
  { key: 'completed', label: 'Completed' },
];

const deliverySteps = [
  { key: 'pending', label: 'Order Placed' },
  { key: 'packed', label: 'Packed' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'completed', label: 'Delivered' },
];

const getSteps = (type: string) =>
  type === 'pickup' ? pickupSteps : deliverySteps;

const getCurrentStep = (status: string, type: string): number => {
  const flow = type === 'pickup'
    ? ['pending', 'ready_for_pickup', 'completed']
    : ['pending', 'packed', 'out_for_delivery', 'completed'];
  return flow.indexOf(status);
};

// ── Empty form state ──────────────────────────────────────────────
const emptyForm = {
  customerName: '',
  contact: '',
  address: '',
  deliveryOption: 'delivery' as 'delivery' | 'pickup',
  paymentStatus: 'pending' as Order['paymentStatus'],
  items: [] as OrderItem[],
  total: 0,
  notes: '',
};

// ── Component ──────────────────────────────────────────────────────
export const Orders: React.FC = () => {
  const { products, orders, addOrder, updateOrder, processPayment, processRefund, loading } = useData();

  // ── Filter / search / modal state ────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'ready_for_pickup' | 'packed' | 'out_for_delivery' | 'completed' | 'cancelled'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [itemSearch, setItemSearch] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [productSearch, setProductSearch] = useState('');

  // ── Cancel confirmation ──────────────────────────────────────────
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);

  // ── Payment modal ────────────────────────────────────────────────
  const [payModal, setPayModal] = useState<Order | null>(null);
  const [payAmount, setPayAmount] = useState(0);

  // ── Refund modal ─────────────────────────────────────────────────
  const [refundModal, setRefundModal] = useState<Order | null>(null);
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundReason, setRefundReason] = useState('');
  const [refundType, setRefundType] = useState<'full' | 'partial'>('partial');

  // ── Filtered list ────────────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = order.customerName.toLowerCase().includes(q) ||
                            order.id.toLowerCase().includes(q) ||
                            order.referenceNumber.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || order.orderStatus === statusFilter;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, searchTerm, statusFilter]);

  // ── Order status transitions ─────────────────────────────────────
  const getNextStatus = (order: Order): Order['orderStatus'] | null => {
    if (order.orderType === 'pickup') {
      const flow: Record<Order['orderStatus'], Order['orderStatus'] | null> = {
        pending: 'ready_for_pickup',
        ready_for_pickup: 'completed',
        packed: null,
        out_for_delivery: null,
        completed: null,
        cancelled: null,
      };
      return flow[order.orderStatus];
    }
    const flow: Record<Order['orderStatus'], Order['orderStatus'] | null> = {
      pending: 'packed',
      ready_for_pickup: null,
      packed: 'out_for_delivery',
      out_for_delivery: 'completed',
      completed: null,
      cancelled: null,
    };
    return flow[order.orderStatus];
  };

  const advanceOrder = (orderId: string, newStatus: Order['orderStatus']) => {
    updateOrder(orderId, { orderStatus: newStatus });
    toast.success(`Order → ${newStatus.replace(/_/g, ' ')}`);
  };

  // ── Modal handlers ───────────────────────────────────────────────
  const openCreate = () => {
    setModalMode('create');
    setEditingOrderId(null);
    setForm(emptyForm);
    setSelectedProduct('');
    setQuantity(1);
    setModalOpen(true);
  };

  const openEdit = (order: Order) => {
    setModalMode('edit');
    setEditingOrderId(order.id);
    setForm({
      customerName: order.customerName,
      contact: order.contact,
      address: order.address,
      deliveryOption: order.orderType,
      paymentStatus: order.paymentStatus,
      items: [...order.items],
      total: order.total,
      notes: order.notes || '',
    });
    setSelectedProduct('');
    setQuantity(1);
    setModalOpen(true);
    setViewOrder(null);
  };

  const closeModal = () => {
    setModalOpen(false);
    setForm(emptyForm);
    setProductSearch('');
  };

  // ── Item management ──────────────────────────────────────────────
  const addItem = () => {
    if (!selectedProduct || quantity <= 0) return;
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;
    if (product.stock < quantity) {
      toast.error(`Only ${product.stock} in stock`);
      return;
    }
    const existing = form.items.findIndex(i => i.productId === product.id);
    if (existing > -1) {
      // Merge quantities for same product
      const merged = form.items.map((i, idx) =>
        idx === existing
          ? { ...i, quantity: i.quantity + quantity, total: (i.quantity + quantity) * i.unitPrice }
          : i
      );
      setForm(p => ({ ...p, items: merged, total: merged.reduce((s, i) => s + i.total, 0) }));
    } else {
      const newItem: OrderItem = {
        productId: product.id,
        productName: product.name,
        quantity,
        unitPrice: product.price,
        total: product.price * quantity,
      };
      setForm(p => ({
        ...p,
        items: [...p.items, newItem],
        total: p.total + newItem.total,
      }));
    }
    setSelectedProduct('');
    setQuantity(1);
  };

  const removeItem = (index: number) => {
    setForm(p => {
      const removed = p.items[index];
      return {
        ...p,
        items: p.items.filter((_, i) => i !== index),
        total: p.total - removed.total,
      };
    });
  };

  const updateItemQty = (index: number, qty: number) => {
    if (qty < 1) return;
    setForm(p => {
      const updated = p.items.map((item, i) =>
        i === index ? { ...item, quantity: qty, total: qty * item.unitPrice } : item
      );
      return { ...p, items: updated, total: updated.reduce((s, i) => s + i.total, 0) };
    });
  };

  // ── Submit ───────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.items.length === 0) { toast.error('Add at least one item'); return; }
    if (!form.customerName.trim()) { toast.error('Enter customer name'); return; }
    if (!form.contact.trim()) { toast.error('Enter contact number'); return; }

    if (modalMode === 'edit' && editingOrderId) {
      updateOrder(editingOrderId, {
        customerName: form.customerName,
        contact: form.contact,
        address: form.address,
        items: form.items,
        total: form.total,
        orderType: form.deliveryOption,
        notes: form.notes,
      });
      toast.success('Order updated');
      closeModal();
      return;
    }

    addOrder({
      customerName: form.customerName,
      contact: form.contact,
      address: form.address,
      items: form.items,
      total: form.total,
      paidAmount:
        form.paymentStatus === 'paid' ? form.total :
        form.paymentStatus === 'partial' ? Math.round(form.total * 0.5) : 0,
      paymentStatus: form.paymentStatus,
      orderStatus: form.deliveryOption === 'pickup' ? 'ready_for_pickup' : 'packed',
      deliveryStatus: form.deliveryOption === 'delivery' ? 'scheduled' : 'not_required',
      orderType: form.deliveryOption,
      date: new Date().toISOString().split('T')[0],
      refundAmount: 0,
      refundStatus: 'none',
      notes: form.notes,
    });
    toast.success('Order created!');
    closeModal();
  };

  // ── Delete order ─────────────────────────────────────────────────
  const handleDelete = (orderId: string) => {
    updateOrder(orderId, { orderStatus: 'cancelled' });
    toast.success('Order cancelled');
    setConfirmCancel(null);
  };

  const closeViewModal = () => {
    setViewOrder(null);
    setItemSearch('');
  };

  // ── Stats helpers ────────────────────────────────────────────────
  const inProgressCount = orders.filter(o =>
    ['pending', 'packed', 'out_for_delivery', 'ready_for_pickup'].includes(o.orderStatus)
  ).length;

  // ── CSV export ──────────────────────────────────────────────────
  const handleExportCSV = () => {
    const csv = toCSV(filteredOrders, [
      { key: 'referenceNumber', header: 'Reference' },
      { key: 'customerName', header: 'Customer' },
      { key: 'contact', header: 'Contact' },
      { key: 'address', header: 'Address' },
      { key: 'orderType', header: 'Type' },
      { key: 'orderStatus', header: 'Order Status' },
      { key: 'paymentStatus', header: 'Payment' },
      { key: 'total', header: 'Total (PHP)' },
      { key: 'paidAmount', header: 'Paid (PHP)' },
      { key: 'date', header: 'Date' },
    ]);
    downloadCSV(`orders-${new Date().toISOString().split('T')[0]}.csv`, csv);
    toast.success(`Exported ${filteredOrders.length} orders to CSV`);
  };

  const statusPills: { key: typeof statusFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'ready_for_pickup', label: 'Ready for Pickup' },
    { key: 'packed', label: 'Packed' },
    { key: 'out_for_delivery', label: 'Out for Delivery' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  const isEmpty = !loading && orders.length === 0;

  // ── View modal item search ───────────────────────────────────────
  const filteredViewItems = useMemo(() => {
    if (!viewOrder) return [];
    if (!itemSearch.trim()) return viewOrder.items;
    const q = itemSearch.toLowerCase();
    return viewOrder.items.filter(i => i.productName.toLowerCase().includes(q));
  }, [viewOrder, itemSearch]);

  // ── Product search in create modal ───────────────────────────────
  const filteredCreateProducts = useMemo(() => {
    if (!productSearch.trim()) return products.filter(p => p.status === 'active');
    const q = productSearch.toLowerCase();
    return products.filter(p => p.status === 'active' && p.name.toLowerCase().includes(q));
  }, [products, productSearch]);

  return (
    <Layout>
      <div className="space-y-6 animate-fadeIn">
        {/* ── Header ────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, ID, or reference…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="input pl-10 w-full sm:w-72"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
              className="input w-full sm:w-44"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="ready_for_pickup">Ready for Pickup</option>
              <option value="packed">Packed</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={filteredOrders.length === 0}
              className="inline-flex items-center gap-2 self-start rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
            <button onClick={openCreate} className="btn-primary flex items-center gap-2">
              <Plus className="w-5 h-5" /> New Order
            </button>
          </div>
        </div>

        {/* Status filter pills */}
        <div className="flex flex-wrap gap-2">
          {statusPills.map((pill) => (
            <button
              key={pill.key}
              type="button"
              onClick={() => setStatusFilter(pill.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === pill.key
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* ── Stats ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{orders.filter(o => o.orderStatus === 'pending').length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">In Progress</p>
            <p className="text-2xl font-bold text-blue-600">{inProgressCount}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-2xl font-bold text-green-600">{orders.filter(o => o.orderStatus === 'completed').length}</p>
          </div>
        </div>

        {/* ── Order cards ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map(order => {
            const remaining = order.total - order.paidAmount;
            return (
              <div
                key={order.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setViewOrder(order)}
              >
                {/* Card header */}
                <div className="p-5 pb-3">
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-gray-900 truncate">{order.customerName}</h4>
                      <p className="text-xs text-gray-400 mt-0.5">{order.referenceNumber}</p>
                    </div>
                    <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(order.orderStatus)}`}>
                      {order.orderStatus.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Package className="w-3.5 h-3.5" /> {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1 capitalize">
                      <Truck className="w-3.5 h-3.5" /> {order.orderType}
                    </span>
                  </div>
                </div>

                {/* Card footer */}
                <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">{formatDate(order.date)}</p>
                    <p className="font-bold text-gray-900">{formatCurrency(order.total)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.paymentStatus)}`}>
                      {order.paymentStatus}
                    </span>
                    {remaining > 0 && order.paymentStatus !== 'pending' && (
                      <p className="text-xs text-red-500 mt-1">₱{remaining.toLocaleString()} remaining</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {filteredOrders.length === 0 && !isEmpty && (
            <div className="col-span-full p-12 text-center">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No orders match the current filters.</p>
              {searchTerm && <button onClick={() => setSearchTerm('')} className="text-blue-600 text-sm mt-1 hover:underline">Clear search</button>}
            </div>
          )}

          {isEmpty && (
            <div className="col-span-full p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                <ShoppingBag className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">No orders yet</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
                Demo data will appear once the backend is connected. In the meantime, you can
                create a demo order below.
              </p>
              <button
                type="button"
                onClick={() => toast.info('Demo build — this would open the create form.')}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-700"
              >
                <Plus className="h-4 w-4" /> Create your first order
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          CREATE / EDIT MODAL
         ═══════════════════════════════════════════════════════════════ */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slideIn">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {modalMode === 'create' ? 'Create New Order' : 'Edit Order'}
                </h3>
                {modalMode === 'edit' && <p className="text-sm text-gray-500">{editingOrderId}</p>}
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* ── Customer ─────────────────────────────────────── */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" /> Customer Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="label">Customer Name *</label>
                    <input type="text" value={form.customerName}
                      onChange={e => setForm({ ...form, customerName: e.target.value })}
                      className="input" required />
                  </div>
                  <div>
                    <label className="label">Contact Number *</label>
                    <input type="text" value={form.contact}
                      onChange={e => setForm({ ...form, contact: e.target.value })}
                      className="input" placeholder="0912-345-6789" required />
                  </div>
                  <div>
                    <label className="label">Delivery Option</label>
                    <select value={form.deliveryOption}
                      onChange={e => setForm({ ...form, deliveryOption: e.target.value as 'delivery' | 'pickup' })}
                      className="input">
                      <option value="delivery">Delivery</option>
                      <option value="pickup">Pickup</option>
                    </select>
                  </div>
                  {form.deliveryOption === 'delivery' && (
                    <div className="sm:col-span-2">
                      <label className="label">Delivery Address *</label>
                      <textarea value={form.address}
                        onChange={e => setForm({ ...form, address: e.target.value })}
                        className="input" rows={2} required />
                    </div>
                  )}
                </div>
              </div>

              {/* ── Items ─────────────────────────────────────────── */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-gray-400" /> Order Items
                </h4>
                <div className="flex gap-3 items-end flex-wrap sm:flex-nowrap">
                  <div className="flex-1 min-w-[200px]">
                    <label className="label">Product</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search products…"
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                        className="input pl-9"
                      />
                    </div>
                    <select
                      value={selectedProduct}
                      onChange={e => {
                        setSelectedProduct(e.target.value);
                        setProductSearch('');
                      }}
                      className="input mt-2"
                      size={Math.min(filteredCreateProducts.length + 1, 6)}
                    >
                      <option value="">
                        {filteredCreateProducts.length === 0
                          ? 'No products found'
                          : 'Select a product…'}
                      </option>
                      {filteredCreateProducts.map(p => (
                        <option key={p.id} value={p.id} disabled={p.stock === 0}>
                          {p.name} — {formatCurrency(p.price)} ({p.stock} avail.)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <label className="label">Qty</label>
                    <input type="number" value={quantity}
                      onChange={e => setQuantity(Math.max(1, Number(e.target.value)))}
                      className="input" min={1} />
                  </div>
                  <button type="button" onClick={addItem} className="btn-primary px-4 mt-0">Add</button>
                </div>

                {form.items.length > 0 && (
                  <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Item</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">Price</th>
                          <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 w-20">Qty</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 w-24">Subtotal</th>
                          <th className="px-3 py-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {form.items.map((item, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-sm font-medium text-gray-900">{item.productName}</td>
                            <td className="px-3 py-2 text-sm text-gray-600 text-right">{formatCurrency(item.unitPrice)}</td>
                            <td className="px-3 py-2 text-center">
                              <div className="inline-flex items-center border border-gray-300 rounded-lg">
                                <button type="button"
                                  onClick={() => updateItemQty(i, item.quantity - 1)}
                                  className="px-2 py-0.5 text-gray-500 hover:bg-gray-100 text-sm leading-none"
                                  disabled={item.quantity <= 1}>−</button>
                                <span className="px-2 py-0.5 text-sm font-medium min-w-[2rem] text-center">{item.quantity}</span>
                                <button type="button"
                                  onClick={() => updateItemQty(i, item.quantity + 1)}
                                  className="px-2 py-0.5 text-gray-500 hover:bg-gray-100 text-sm leading-none">+</button>
                              </div>
                            </td>
                            <td className="px-3 py-2 text-sm font-medium text-gray-900 text-right">{formatCurrency(item.total)}</td>
                            <td className="px-3 py-2">
                              <button type="button" onClick={() => removeItem(i)}
                                className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* ── Notes ─────────────────────────────────────────── */}
              <div>
                <label className="label">Notes (optional)</label>
                <textarea value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="input" rows={2} placeholder="Special instructions, remarks…" />
              </div>

              {/* ── Payment & Summary ─────────────────────────────── */}
              {modalMode === 'create' && (
                <div>
                  <label className="label">Payment Status</label>
                  <select value={form.paymentStatus}
                    onChange={e => setForm({ ...form, paymentStatus: e.target.value as 'pending' | 'paid' | 'partial' })}
                    className="input">
                    <option value="pending">Pending</option>
                    <option value="paid">Paid in Full</option>
                    <option value="partial">Partial Payment (50%)</option>
                  </select>
                </div>
              )}

              <div className="flex items-center justify-between bg-primary-50 p-4 rounded-xl">
                <span className="text-sm text-primary-600 font-medium">Total Amount</span>
                <span className="text-2xl font-bold text-primary-900">{formatCurrency(form.total)}</span>
              </div>

              {/* ── Actions ────────────────────────────────────────── */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 btn-secondary">Cancel</button>
                <button type="submit" className="flex-1 btn-primary" disabled={form.items.length === 0}>
                  {modalMode === 'create' ? 'Create Order' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          VIEW ORDER MODAL
         ═══════════════════════════════════════════════════════════════ */}
      {viewOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slideIn">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Order Details</h3>
                <p className="text-sm text-gray-500">{viewOrder.referenceNumber} · {viewOrder.id}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(viewOrder)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600" title="Edit Order">
                  <Edit3 className="w-5 h-5" />
                </button>
                <button onClick={() => { closeViewModal(); window.print(); }} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700" title="Print Receipt">
                  <Printer className="w-5 h-5" />
                </button>
                <button onClick={() => closeViewModal()} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* ── Progress Timeline ──────────────────────────────── */}
              {(viewOrder.orderStatus !== 'cancelled') && (
                <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                  <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" /> Order Progress
                  </h4>
                  <div className="flex items-center justify-between relative">
                    <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-gray-200 -translate-y-1/2" />
                    <div
                      className="absolute top-1/2 left-4 h-0.5 bg-blue-600 -translate-y-1/2 transition-all duration-500"
                      style={{
                        width: `${(getCurrentStep(viewOrder.orderStatus, viewOrder.orderType) / Math.max(getSteps(viewOrder.orderType).length - 1, 1)) * 100}%`,
                      }}
                    />
                    {getSteps(viewOrder.orderType).map((step, i) => {
                      const current = getCurrentStep(viewOrder.orderStatus, viewOrder.orderType);
                      const done = i <= current;
                      const isCurrent = i === current;
                      return (
                        <div key={step.key} className="relative flex flex-col items-center z-10">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            done ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
                          } ${isCurrent ? 'ring-4 ring-blue-100' : ''}`}>
                            {done ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                          </div>
                          <p className={`mt-1.5 text-[10px] font-medium text-center whitespace-nowrap ${
                            isCurrent ? 'text-blue-700' : done ? 'text-gray-900' : 'text-gray-400'
                          }`}>
                            {step.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {viewOrder.orderStatus === 'cancelled' && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                  <X className="w-8 h-8 text-red-400 mx-auto mb-2" />
                  <p className="font-semibold text-red-700">Order Cancelled</p>
                  <p className="text-sm text-red-500">This order has been cancelled</p>
                </div>
              )}

              {/* ── Customer Info ──────────────────────────────────── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Customer</p>
                  <p className="font-semibold text-gray-900">{viewOrder.customerName}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Contact</p>
                  <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-400" /> {viewOrder.contact}
                  </p>
                </div>
                {viewOrder.address && (
                  <div className="sm:col-span-2 bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">Delivery Address</p>
                    <p className="font-semibold text-gray-900 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" /> {viewOrder.address}
                    </p>
                  </div>
                )}
              </div>

              {/* ── Status badges ──────────────────────────────────── */}
              <div className="flex flex-wrap gap-3">
                <div className="px-4 py-3 rounded-xl bg-gray-50">
                  <p className="text-xs text-gray-500 mb-1">Order Status</p>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(viewOrder.orderStatus)}`}>
                    {viewOrder.orderStatus.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="px-4 py-3 rounded-xl bg-gray-50">
                  <p className="text-xs text-gray-500 mb-1">Payment</p>
                  <select
                    value={viewOrder.paymentStatus}
                    onChange={e => {
                      const v = e.target.value as 'pending' | 'paid' | 'partial' | 'refunded';
                      updateOrder(viewOrder.id, { paymentStatus: v });
                      setViewOrder({ ...viewOrder, paymentStatus: v });
                    }}
                    className="mt-1 px-3 py-1 rounded-full text-sm font-medium bg-white border border-gray-300 cursor-pointer"
                  >
                    <option value="pending">Pending</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
                <div className="px-4 py-3 rounded-xl bg-gray-50">
                  <p className="text-xs text-gray-500 mb-1">Type</p>
                  <span className="capitalize px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                    {viewOrder.orderType}
                  </span>
                </div>
              </div>

              {/* ── Payment Summary ────────────────────────────────── */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-green-50 p-3 rounded-xl">
                  <p className="text-xs text-green-600">Total</p>
                  <p className="text-lg font-bold text-green-900">{formatCurrency(viewOrder.total)}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-xl">
                  <p className="text-xs text-blue-600">Paid</p>
                  <p className="text-lg font-bold text-blue-900">{formatCurrency(viewOrder.paidAmount)}</p>
                </div>
                <div className={viewOrder.total - viewOrder.paidAmount > 0 ? 'bg-red-50 p-3 rounded-xl' : 'bg-gray-50 p-3 rounded-xl'}>
                  <p className="text-xs text-gray-500">Balance</p>
                  <p className={`text-lg font-bold ${viewOrder.total - viewOrder.paidAmount > 0 ? 'text-red-700' : 'text-gray-700'}`}>
                    {formatCurrency(Math.max(0, viewOrder.total - viewOrder.paidAmount))}
                  </p>
                </div>
                <div className="bg-purple-50 p-3 rounded-xl">
                  <p className="text-xs text-purple-600">Refunded</p>
                  <p className="text-lg font-bold text-purple-900">{formatCurrency(viewOrder.refundAmount || 0)}</p>
                </div>
              </div>

              {/* ── Items Table ────────────────────────────────────── */}
              <div>
                {viewOrder.items.length > 1 && (
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search items…"
                      value={itemSearch}
                      onChange={e => setItemSearch(e.target.value)}
                      className="input pl-9 py-2 text-sm"
                    />
                  </div>
                )}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Item</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Price</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase w-16">Qty</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase w-28">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredViewItems.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-400">No matching items</td>
                        </tr>
                      ) : (
                        filteredViewItems.map((item, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">{item.productName}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 text-right">{formatCurrency(item.unitPrice)}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-center">{item.quantity}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{formatCurrency(item.total)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">Total</td>
                        <td className="px-4 py-3 text-lg font-bold text-gray-900 text-right">{formatCurrency(viewOrder.total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* ── Notes ──────────────────────────────────────────── */}
              {viewOrder.notes && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <p className="text-xs text-yellow-700 font-medium mb-1">Notes</p>
                  <p className="text-sm text-yellow-800">{viewOrder.notes}</p>
                </div>
              )}

              {/* ── Actions ────────────────────────────────────────── */}
              {viewOrder.orderStatus !== 'completed' && viewOrder.orderStatus !== 'cancelled' && (
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  {/* Advance */}
                  {getNextStatus(viewOrder) && (
                    <button
                      onClick={() => {
                        advanceOrder(viewOrder.id, getNextStatus(viewOrder)!);
                        closeViewModal();
                      }}
                      className="flex-1 btn-primary flex items-center justify-center gap-2"
                    >
                      <ChevronRight className="w-5 h-5" />
                      Mark as {getNextStatus(viewOrder)?.replace(/_/g, ' ')}
                    </button>
                  )}
                  {/* Payment */}
                  {(viewOrder.paidAmount < viewOrder.total) && (
                    <button
                      onClick={() => { setPayModal(viewOrder); setPayAmount(viewOrder.total - viewOrder.paidAmount); }}
                      className="btn-secondary flex items-center justify-center gap-2"
                    >
                      <DollarSign className="w-5 h-5" /> Process Payment
                    </button>
                  )}
                  {/* Refund */}
                  {viewOrder.paidAmount > 0 && (
                    <button
                      onClick={() => {
                        setRefundModal(viewOrder);
                        setRefundAmount(viewOrder.paidAmount);
                        setRefundType('partial');
                        setRefundReason('');
                      }}
                      className="px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" /> Refund
                    </button>
                  )}
                  {/* Cancel */}
                  <button
                    onClick={() => setConfirmCancel(viewOrder.id)}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <X className="w-4 h-4" /> Cancel Order
                  </button>
                </div>
              )}

              {/* Completed — show view only */}
              {viewOrder.orderStatus === 'completed' && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="font-semibold text-green-700">Order Completed</p>
                  <p className="text-sm text-green-600">Delivered on {formatDate(viewOrder.date)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          CANCEL CONFIRMATION
         ═══════════════════════════════════════════════════════════════ */}
      {confirmCancel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 animate-slideIn text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cancel Order?</h3>
            <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmCancel(null)} className="flex-1 btn-secondary">Keep Order</button>
              <button onClick={() => handleDelete(confirmCancel)} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold">Yes, Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          PAYMENT MODAL
         ═══════════════════════════════════════════════════════════════ */}
      {payModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 animate-slideIn">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Process Payment</h3>
            <p className="text-sm text-gray-500 mb-1">Order: {payModal.referenceNumber}</p>
            <p className="text-sm text-gray-500 mb-4">Balance: {formatCurrency(payModal.total - payModal.paidAmount)}</p>
            <div className="mb-4">
              <label className="label">Payment Amount</label>
              <input type="number" value={payAmount}
                onChange={e => setPayAmount(Math.min(Number(e.target.value), payModal.total - payModal.paidAmount))}
                className="input" min={1} max={payModal.total - payModal.paidAmount} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setPayModal(null)} className="flex-1 btn-secondary">Cancel</button>
              <button onClick={() => {
                processPayment(payModal.id, payAmount);
                closeViewModal();
                setPayModal(null);
                toast.success(`Payment of ${formatCurrency(payAmount)} recorded`);
              }} className="flex-1 btn-primary">Pay {formatCurrency(payAmount)}</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          REFUND MODAL
         ═══════════════════════════════════════════════════════════════ */}
      {refundModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 animate-slideIn">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Process Refund</h3>
            <p className="text-sm text-gray-500 mb-1">Order: {refundModal.referenceNumber}</p>
            <p className="text-sm text-gray-500 mb-4">Paid Amount: {formatCurrency(refundModal.paidAmount)}</p>
            <div className="space-y-4">
              <div>
                <label className="label">Refund Amount</label>
                <input type="number" value={refundAmount}
                  onChange={e => setRefundAmount(Math.min(Number(e.target.value), refundModal.paidAmount))}
                  className="input" min={1} max={refundModal.paidAmount} />
              </div>
              <div>
                <label className="label">Reason</label>
                <select value={refundReason}
                  onChange={e => setRefundReason(e.target.value)}
                  className="input">
                  <option value="">Select reason…</option>
                  <option value="Customer request">Customer request</option>
                  <option value="Damaged items">Damaged items</option>
                  <option value="Wrong items">Wrong items</option>
                  <option value="Order cancelled">Order cancelled</option>
                </select>
              </div>
              <div>
                <label className="label">Refund Type</label>
                <select value={refundType}
                  onChange={e => setRefundType(e.target.value as 'full' | 'partial')}
                  className="input">
                  <option value="partial">Partial</option>
                  <option value="full">Full</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setRefundModal(null)} className="flex-1 btn-secondary">Cancel</button>
              <button onClick={() => {
                processRefund(refundModal.id, refundAmount, refundReason || 'No reason specified', refundType);
                closeViewModal();
                setRefundModal(null);
                toast.success(`Refund of ${formatCurrency(refundAmount)} processed`);
              }} className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors font-semibold">
                Process Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};
