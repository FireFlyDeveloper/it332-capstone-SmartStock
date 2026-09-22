import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Search,
  ShoppingCart,
  Package,
  RotateCcw,
  Settings,
  DollarSign,
  Clock,
  Calendar,
  ArrowUpRight,
  X,
  Filter
} from 'lucide-react';
import { useData } from '../components/DataContext';
import { formatCurrency, formatDate, getStatusColor, formatDateInput } from '../utils/helpers';
import { toCSV, downloadCSV } from '../utils/csv';
import { toast } from 'sonner';
import { apiFetchBlob, type ApiError } from '../api';
import { useAuth } from '../components/AuthContext';

type DateRangePreset = '7d' | '30d' | 'all' | 'custom';
type ExportType = 'sales' | 'purchases' | 'inventory' | 'spending';

const EXPORT_TYPE_LABELS: Record<ExportType, string> = {
  sales: 'Sales Report',
  purchases: 'Purchases Report',
  inventory: 'Inventory Evaluation',
  spending: 'Spending Report',
};


interface ReportCardProps {
  title: string;
  value: string;
  badge?: string;
  icon: React.ElementType;
  iconBoxBg: string;
  iconColor: string;
  badgeBg: string;
  badgeColor: string;
  badgeBorder?: string;
  badgeIcon?: React.ElementType;
}

const ReportCard: React.FC<ReportCardProps> = ({
  title,
  value,
  badge,
  icon: Icon,
  iconBoxBg,
  iconColor,
  badgeBg,
  badgeColor,
  badgeBorder = 'border-slate-100',
  badgeIcon: BadgeIcon,
}) => (
  <div className="bg-white rounded-[28px] shadow-sm border border-[#f1f5f9] p-6 micro-hover flex flex-col justify-between min-w-0 overflow-hidden">
    {/* Top row: Icon Box on the left, Badge pill on the right */}
    <div className="flex items-center justify-between gap-2 mb-4 min-w-0">
      <div className={`w-11 h-11 rounded-xl ${iconBoxBg} ${iconColor} flex items-center justify-center shrink-0 shadow-2xs`}>
        <Icon className="w-5 h-5" />
      </div>
      {badge && (
        <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full ${badgeBg} ${badgeColor} border ${badgeBorder} text-xs font-bold shrink-0`}>
          {BadgeIcon && <BadgeIcon className="w-3.5 h-3.5 shrink-0" />}
          <span>{badge}</span>
        </div>
      )}
    </div>

    {/* Bottom row: Label & full-width Value */}
    <div className="space-y-1 min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 truncate">
        {title}
      </p>
      <div className="min-w-0">
        <span
          title={value}
          className="text-2xl sm:text-[26px] font-black text-slate-900 tracking-tight leading-none truncate block"
        >
          {value}
        </span>
      </div>
    </div>
  </div>
);

export const Reports: React.FC = () => {
  const { products, orders } = useData();
  const { canExportReports } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'cancelled'>('all');
  const [datePreset, setDatePreset] = useState<DateRangePreset>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [exportType, setExportType] = useState<ExportType>('sales');
  const [generatedAt] = useState(() => new Date().toLocaleString());

  // Anchor date: latest date in orders (or fallback to current date)
  const latestOrderDate = useMemo(() => {
    if (!orders || orders.length === 0) return new Date();
    const timestamps = orders.map(o => new Date(o.date).getTime()).filter(t => !isNaN(t));
    return timestamps.length > 0 ? new Date(Math.max(...timestamps)) : new Date();
  }, [orders]);

  const handleDatePreset = (preset: '7d' | '30d' | 'all') => {
    setDatePreset(preset);
    if (preset === 'all') {
      setFromDate('');
      setToDate('');
      toast.info('Showing all-time records.');
    } else {
      const end = new Date(latestOrderDate);
      const start = new Date(latestOrderDate);
      const days = preset === '7d' ? 7 : 30;
      start.setDate(start.getDate() - days);
      const startStr = formatDateInput(start);
      const endStr = formatDateInput(end);
      setFromDate(startStr);
      setToDate(endStr);
      toast.success(`Filtered to last ${days} days (${startStr} to ${endStr})`);
    }
  };

  const handleFromDateChange = (val: string) => {
    setFromDate(val);
    setDatePreset('custom');
  };

  const handleToDateChange = (val: string) => {
    setToDate(val);
    setDatePreset('custom');
  };

  const handleClearDates = () => {
    setFromDate('');
    setToDate('');
    setDatePreset('all');
    toast.info('Date filters cleared.');
  };

  // Filter orders by specific date range (from / to)
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (fromDate && order.date < fromDate) return false;
      if (toDate && order.date > toDate) return false;
      return true;
    });
  }, [orders, fromDate, toDate]);

  // Build dynamic transaction history from filtered orders
  const transactionHistory = useMemo(() => {
    return filteredOrders.map((order, i) => ({
      id: `TXN-${String(i + 1).padStart(3, '0')}`,
      type: 'sale' as const,
      reference: order.referenceNumber,
      items: order.items.map(item => ({
        name: item.productName,
        quantity: item.quantity,
        amount: item.total,
      })),
      total: order.total,
      date: order.date,
      status: (order.orderStatus === 'completed' ? 'completed' : 
               order.orderStatus === 'cancelled' ? 'cancelled' : 'pending') as 'completed' | 'pending' | 'cancelled',
    }));
  }, [filteredOrders]);

  // Filter transactions by search term and status filter
  const filteredTransactions = useMemo(() => {
    return transactionHistory.filter(txn => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q || 
        txn.reference.toLowerCase().includes(q) ||
        txn.id.toLowerCase().includes(q) ||
        txn.items.some(item => item.name.toLowerCase().includes(q));
      const matchesStatus = statusFilter === 'all' || txn.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter, transactionHistory]);

  // Calculate summary stats dynamically based on filtered orders
  const totalSales = filteredOrders.filter(o => o.orderStatus === 'completed').reduce((sum, o) => sum + o.total, 0);
  const totalRevenue = totalSales;
  const totalOrders = filteredOrders.length;
  const completedOrders = filteredOrders.filter(o => o.orderStatus === 'completed').length;
  const pendingOrders = filteredOrders.filter(o => ['pending', 'packed', 'out_for_delivery', 'ready_for_pickup'].includes(o.orderStatus)).length;
  const totalProducts = products.length;
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0);

  const handlePrint = () => {
    toast.info('Opening browser print dialog...');
    window.print();
  };

  const handleExport = async (format: 'pdf' | 'xlsx') => {
    const label = format.toUpperCase();
    const typeLabel = EXPORT_TYPE_LABELS[exportType];
    toast.info(`Preparing ${typeLabel} (${label})...`);
    try {
      const response = await apiFetchBlob(`/reports/export?type=${exportType}&format=${format}`);
      const blob = await response.blob();
      const fallbackName = `smartstock-${exportType}-report.${format}`;
      const disposition = response.headers.get('content-disposition') ?? '';
      const filename = disposition.match(/filename="?([^";]+)"?/)?.[1] ?? fallbackName;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success(`${typeLabel} (${label}) downloaded successfully.`);
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.status === 403) {
        toast.error('Only admins can export PDF/XLSX reports.');
      } else {
        toast.error(apiError.message || `Failed to export ${label} report.`);
      }
    }
  };

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      toast.warning('No transactions found to export for the selected date range.');
      return;
    }
    const rows = filteredTransactions.map((txn) => ({
      id: txn.id,
      type: txn.type,
      reference: txn.reference,
      items: txn.items.map((i) => `${i.name} (qty: ${i.quantity})`).join('; '),
      total: txn.total,
      date: txn.date,
      status: txn.status,
    }));
    const columns: { key: keyof typeof rows[0]; header: string }[] = [
      { key: 'id', header: 'Transaction ID' },
      { key: 'type', header: 'Type' },
      { key: 'reference', header: 'Reference' },
      { key: 'items', header: 'Items' },
      { key: 'total', header: 'Total (PHP)' },
      { key: 'date', header: 'Date' },
      { key: 'status', header: 'Status' },
    ];
    const csvData = toCSV(rows, columns);
    const dateRangeSlug = fromDate || toDate ? `_${fromDate || 'start'}_to_${toDate || 'end'}` : '_all-time';
    downloadCSV(`smartstock-${exportType}-report${dateRangeSlug}.csv`, csvData);
    toast.success(`Exported ${filteredTransactions.length} transaction records to CSV.`);
  };

  const getTransactionIcon = (type: 'sale' | 'restock' | 'return' | 'adjustment') => {
    switch (type) {
      case 'sale': return ShoppingCart;
      case 'restock': return Package;
      case 'return': return RotateCcw;
      case 'adjustment': return Settings;
      default: return DollarSign;
    }
  };

  const getTransactionColor = (type: 'sale' | 'restock' | 'return' | 'adjustment') => {
    switch (type) {
      case 'sale': return 'bg-emerald-50 text-[#10b981]';
      case 'restock': return 'bg-indigo-50 text-[#4f46e5]';
      case 'return': return 'bg-rose-50 text-[#f43f5e]';
      case 'adjustment': return 'bg-amber-50 text-[#f59e0b]';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
      <div className="space-y-6 animate-fadeIn">
        {/* Header — title + generated-at */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-[-0.02em]">
              Financial Reports &amp; Statement
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Generated on: <span className="font-mono text-slate-700">{generatedAt}</span>
            </p>
          </div>
        </div>

        {/* Filter Toolbar Card: Date Range (presets + specific From/To) & Export Controls */}
        <div className="bg-white rounded-[28px] p-5 sm:p-6 border border-[#f1f5f9] shadow-sm space-y-4">
          {/* Row 1: Date Range Presets & Specific Date From / To */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Date Range:</span>
              </div>
              {(['all', '30d', '7d'] as const).map((key) => {
                const label = key === 'all' ? 'All time' : key === '30d' ? 'Last 30 days' : 'Last 7 days';
                const isActive = datePreset === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleDatePreset(key)}
                    className={`rounded-2xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-[#4f46e5] text-white shadow-md shadow-indigo-900/20'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
              {datePreset === 'custom' && (
                <span className="rounded-2xl px-3.5 py-1.5 text-xs font-bold bg-indigo-50 text-[#4f46e5] border border-indigo-100">
                  Custom Range
                </span>
              )}
            </div>

            {/* Specific Date From -> To */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5">
                <label htmlFor="report-from-date" className="text-xs font-bold text-slate-500 whitespace-nowrap">
                  From:
                </label>
                <input
                  id="report-from-date"
                  type="date"
                  value={fromDate}
                  onChange={(e) => handleFromDateChange(e.target.value)}
                  className="rounded-xl border border-slate-200/80 bg-slate-50/50 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:bg-white focus:border-[#4f46e5] focus:outline-none transition-all shadow-2xs"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <label htmlFor="report-to-date" className="text-xs font-bold text-slate-500 whitespace-nowrap">
                  To:
                </label>
                <input
                  id="report-to-date"
                  type="date"
                  value={toDate}
                  onChange={(e) => handleToDateChange(e.target.value)}
                  className="rounded-xl border border-slate-200/80 bg-slate-50/50 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:bg-white focus:border-[#4f46e5] focus:outline-none transition-all shadow-2xs"
                />
              </div>

              {(fromDate || toDate) && (
                <button
                  type="button"
                  onClick={handleClearDates}
                  title="Clear date filters"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/70 transition-colors shadow-2xs"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          <div className="h-px bg-[#f1f5f9] w-full" />

          {/* Row 2: Search, Status Filter & Export Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Search + Status Filter */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search reference, items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input !pl-10 w-full sm:w-64 text-xs font-medium"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-400 hidden sm:inline">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs font-bold text-slate-700 focus:border-[#4f46e5] focus:outline-none shadow-2xs"
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Export Filter + Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Export Type Selector */}
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 text-xs font-bold text-slate-400">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Export:</span>
                </div>
                <select
                  value={exportType}
                  onChange={(e) => setExportType(e.target.value as ExportType)}
                  className="rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs font-bold text-slate-700 focus:border-[#4f46e5] focus:outline-none shadow-2xs"
                  title="Choose report type to export"
                >
                  <option value="sales">Sales Report</option>
                  <option value="purchases">Purchases Report</option>
                  <option value="inventory">Inventory Evaluation</option>
                  <option value="spending">Spending Report</option>
                </select>
              </div>

              {/* Action Buttons */}
              {canExportReports ? (
                <>
                  <button
                    type="button"
                    onClick={() => void handleExport('pdf')}
                    className="btn-secondary flex items-center gap-1.5 text-xs font-bold py-2 px-3 shadow-2xs"
                    title={`Export ${EXPORT_TYPE_LABELS[exportType]} as PDF`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleExport('xlsx')}
                    className="btn-secondary flex items-center gap-1.5 text-xs font-bold py-2 px-3 shadow-2xs"
                    title={`Export ${EXPORT_TYPE_LABELS[exportType]} as XLSX`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    XLSX
                  </button>
                </>
              ) : (
                <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
                  Exports are admin-only
                </span>
              )}

              {/* CSV export (available for filtered table data) */}
              <button
                type="button"
                onClick={handleExportCSV}
                className="btn-secondary flex items-center gap-1.5 text-xs font-bold py-2 px-3 text-slate-700 shadow-2xs"
                title="Export current filtered transactions as CSV"
              >
                <Download className="w-3.5 h-3.5" />
                CSV
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="btn-primary flex items-center gap-1.5 text-xs font-bold py-2 px-3.5 shadow-2xs"
                title="Print current report view"
              >
                <Printer className="w-3.5 h-3.5" />
                Print
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <ReportCard
            title="Total Revenue"
            value={formatCurrency(totalRevenue)}
            badge="Completed"
            icon={DollarSign}
            iconBoxBg="bg-emerald-50"
            iconColor="text-[#10b981]"
            badgeBg="bg-emerald-50"
            badgeColor="text-emerald-700"
            badgeBorder="border-emerald-100/60"
            badgeIcon={ArrowUpRight}
          />
          <ReportCard
            title="Total Orders"
            value={totalOrders.toString()}
            badge={`${completedOrders} completed`}
            icon={ShoppingCart}
            iconBoxBg="bg-indigo-50"
            iconColor="text-[#4f46e5]"
            badgeBg="bg-indigo-50"
            badgeColor="text-[#4f46e5]"
            badgeBorder="border-indigo-100/60"
            badgeIcon={Package}
          />
          <ReportCard
            title="Inventory Value"
            value={formatCurrency(totalInventoryValue)}
            badge={`${totalProducts} products`}
            icon={Package}
            iconBoxBg="bg-purple-50"
            iconColor="text-purple-600"
            badgeBg="bg-purple-50"
            badgeColor="text-purple-700"
            badgeBorder="border-purple-100/60"
          />
          <ReportCard
            title="Pending Orders"
            value={pendingOrders.toString()}
            badge={pendingOrders > 0 ? `${pendingOrders} awaiting` : 'All clear'}
            icon={Clock}
            iconBoxBg="bg-amber-50"
            iconColor="text-amber-600"
            badgeBg="bg-amber-50"
            badgeColor="text-amber-700"
            badgeBorder="border-amber-100/60"
            badgeIcon={Clock}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Status Breakdown */}
          <div className="bg-white rounded-[28px] shadow-sm border border-[#f1f5f9] p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Order Status Breakdown</h3>
            <div className="space-y-4">
              {[
                { status: 'Completed', count: filteredOrders.filter(o => o.orderStatus === 'completed').length, color: 'bg-emerald-500', total: completedOrders },
                { status: 'In Progress', count: filteredOrders.filter(o => ['packed', 'out_for_delivery', 'ready_for_pickup'].includes(o.orderStatus)).length, color: 'bg-sky-500', total: filteredOrders.filter(o => ['packed', 'out_for_delivery', 'ready_for_pickup'].includes(o.orderStatus)).length },
                { status: 'Pending', count: filteredOrders.filter(o => o.orderStatus === 'pending').length, color: 'bg-amber-500', total: filteredOrders.filter(o => o.orderStatus === 'pending').length },
                { status: 'Cancelled', count: filteredOrders.filter(o => o.orderStatus === 'cancelled').length, color: 'bg-rose-500', total: filteredOrders.filter(o => o.orderStatus === 'cancelled').length },
              ].map((item) => (
                <div key={item.status} className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-slate-600">{item.status}</span>
                    <span className="font-bold text-slate-900">{item.count} orders</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-2 rounded-full ${item.color} transition-all duration-500`} 
                      style={{ width: `${filteredOrders.length > 0 ? (item.count / filteredOrders.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Status Breakdown */}
          <div className="bg-white rounded-[28px] shadow-sm border border-[#f1f5f9] p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Payment Status Breakdown</h3>
            <div className="space-y-4">
              {[
                { status: 'Paid', count: filteredOrders.filter(o => o.paymentStatus === 'paid').length, color: 'bg-emerald-500' },
                { status: 'Pending', count: filteredOrders.filter(o => o.paymentStatus === 'pending').length, color: 'bg-amber-500' },
                { status: 'Partial', count: filteredOrders.filter(o => o.paymentStatus === 'partial').length, color: 'bg-orange-500' },
                { status: 'Refunded', count: filteredOrders.filter(o => o.paymentStatus === 'refunded').length, color: 'bg-rose-500' },
              ].map((item) => (
                <div key={item.status} className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-slate-600">{item.status}</span>
                    <span className="font-bold text-slate-900">{item.count} orders</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-2 rounded-full ${item.color} transition-all duration-500`} 
                      style={{ width: `${filteredOrders.length > 0 ? (item.count / filteredOrders.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-[28px] shadow-sm border border-[#f1f5f9] overflow-hidden">
          <div className="p-6 border-b border-[#f1f5f9]">
            <h3 className="text-lg font-bold text-slate-900">Transaction History</h3>
            <p className="text-xs text-slate-500 mt-0.5">Recent financial transactions</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/80 border-b border-[#f1f5f9]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Reference</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {filteredTransactions.map((txn) => {
                  const Icon = getTransactionIcon(txn.type);
                  return (
                    <tr key={txn.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-500 font-medium">{txn.id}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`p-2 rounded-xl shadow-2xs ${getTransactionColor(txn.type)}`}>
                            <Icon className="w-4 h-4" />
                          </span>
                          <span className="text-sm font-semibold text-slate-900 capitalize">{txn.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900 font-semibold">{txn.reference}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {txn.items.map((item, idx) => (
                          <div key={idx} className="text-xs">
                            <span className="font-medium text-slate-700">{item.name}:</span> {item.quantity} × {formatCurrency(item.amount)}
                          </div>
                        ))}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-900">{formatCurrency(txn.total)}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{formatDate(txn.date)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(txn.status)}`}>
                          {txn.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {filteredTransactions.length === 0 && (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium text-sm">No transactions found</p>
            </div>
          )}
        </div>

        {/* Print-friendly report preview */}
        <div className="bg-white rounded-[28px] shadow-sm border border-[#f1f5f9] p-6 print:hidden">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Print-Friendly Report Preview</h3>
              <p className="text-xs text-slate-500 mt-0.5">How the report will look when printed</p>
            </div>
            <button
              onClick={handlePrint}
              className="btn-primary flex items-center gap-2"
            >
              <Printer className="w-5 h-5" />
              Print Now
            </button>
          </div>
          
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 bg-slate-50/50">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">SMARTSTOCK</h2>
              <p className="text-slate-500 text-sm font-medium">Glassram Glass and Aluminum Supply</p>
              <p className="text-xs text-slate-400 mt-2 font-medium">
                {EXPORT_TYPE_LABELS[exportType]}
              </p>
              <p className="text-xs text-slate-400">
                Period: {fromDate ? formatDate(fromDate) : 'All Time'} {toDate ? `to ${formatDate(toDate)}` : ''} • Generated: {new Date().toLocaleDateString()}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-8">
              <div className="p-5 border border-[#f1f5f9] rounded-2xl bg-white shadow-2xs">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Total Revenue</p>
                <p className="text-xl font-black text-slate-900 mt-1">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="p-5 border border-[#f1f5f9] rounded-2xl bg-white shadow-2xs">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Total Orders</p>
                <p className="text-xl font-black text-slate-900 mt-1">{totalOrders}</p>
              </div>
              <div className="p-5 border border-[#f1f5f9] rounded-2xl bg-white shadow-2xs">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Completed Orders</p>
                <p className="text-xl font-black text-slate-900 mt-1">{completedOrders}</p>
              </div>
              <div className="p-5 border border-[#f1f5f9] rounded-2xl bg-white shadow-2xs">
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Pending Orders</p>
                <p className="text-xl font-black text-slate-900 mt-1">{pendingOrders}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default Reports;
