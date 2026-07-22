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
  Calendar
} from 'lucide-react';
import { useData } from '../components/DataContext';
import { formatCurrency, formatDate, getStatusColor } from '../utils/helpers';
import { toast } from 'sonner';
import { apiFetchBlob, type ApiError } from '../api';
import { useAuth } from '../components/AuthContext';

// Last touched: 2026-07-07 (round 2 - demo polish)
type DateRange = '7d' | '30d' | 'all';

const DATE_PILLS: { key: DateRange; label: string }[] = [
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: 'all', label: 'All time' },
];

const ReportCard: React.FC<{
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
}> = ({ title, value, subtitle, icon: Icon, color }) => (
  <div className="metric-card p-5 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-text-muted">{title}</p>
        <p className="text-2xl font-bold text-text mt-1">{value}</p>
        {subtitle && <p className="text-sm text-text-muted mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-[var(--radius-card)] ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </div>
);

export const Reports: React.FC = () => {
  const { products, orders } = useData();
  const { canExportReports } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [generatedAt] = useState(() => new Date().toLocaleString());

  // Build dynamic transaction history from orders
  const transactionHistory = useMemo(() => {
    return orders.map((order, i) => ({
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
  }, [orders]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactionHistory.filter(txn => {
      const matchesSearch = txn.reference.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [searchTerm]);

  // Calculate summary stats
  const totalSales = orders.filter(o => o.orderStatus === 'completed').reduce((sum, o) => sum + o.total, 0);
  const totalRevenue = totalSales;
  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.orderStatus === 'completed').length;
  const pendingOrders = orders.filter(o => ['pending', 'packed', 'out_for_delivery', 'ready_for_pickup'].includes(o.orderStatus)).length;
  const totalProducts = products.length;
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0);

  const handlePrint = () => {
    toast.info('Opening browser print dialog...');
    window.print();
  };

  const handleExport = async (format: 'pdf' | 'xlsx') => {
    const label = format.toUpperCase();
    toast.info(`Preparing ${label} export...`);
    try {
      const response = await apiFetchBlob(`/reports/export?type=sales&format=${format}`);
      const blob = await response.blob();
      const fallbackName = `smartstock-sales-report.${format}`;
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
      toast.success(`${label} report downloaded.`);
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.status === 403) {
        toast.error('Only admins can export PDF/XLSX reports.');
      } else {
        toast.error(apiError.message || `Failed to export ${label} report.`);
      }
    }
  };

  const handleDatePill = (key: DateRange) => {
    setDateRange(key);
    toast.info('Demo data is static - date range is for display only.');
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
      case 'sale': return 'bg-[var(--success-soft)] text-[var(--success)]';
      case 'restock': return 'bg-accent-soft text-accent';
      case 'return': return 'bg-danger-soft text-danger';
      case 'adjustment': return 'bg-accent-soft text-accent';
      default: return 'bg-surface-2 text-text-muted';
    }
  };

  return (
      <div className="page-stack animate-fadeIn">
        {/* Header - title + generated-at + date pills */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text">Reports</h1>
            <p className="text-sm text-text-muted mt-1">
              Generated at: <span className="font-mono text-text-muted">{generatedAt}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2" aria-label="Date range">
            <Calendar className="w-4 h-4 text-text-subtle" aria-hidden="true" />
            {DATE_PILLS.map((pill) => (
              <button
                key={pill.key}
                type="button"
                onClick={() => handleDatePill(pill.key)}
                className={`rounded-[var(--radius-pill)] px-3 py-1 text-xs font-medium transition-colors ${
                  dateRange === pill.key
                    ? 'bg-accent text-accent-fg'
                    : 'bg-surface-2 text-text-muted hover:bg-[var(--surface-3)]'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search + Print/Export row */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-subtle" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full sm:w-64"
              />
            </div>
          </div>

          <div className="flex gap-3">
            {canExportReports ? (
              <>
                <button
                  onClick={() => void handleExport('pdf')}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  PDF
                </button>
                <button
                  onClick={() => void handleExport('xlsx')}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  XLSX
                </button>
              </>
            ) : (
              <span className="rounded-[var(--radius-input)] border border-border bg-surface-2 px-3 py-2 text-sm text-text-muted">
                Exports are admin-only
              </span>
            )}
            <button
              onClick={handlePrint}
              className="btn-primary flex items-center gap-2"
            >
              <Printer className="w-5 h-5" />
              Print Report
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <ReportCard
            title="Total Revenue"
            value={formatCurrency(totalRevenue)}
            subtitle="From completed orders"
            icon={DollarSign}
            color="bg-[var(--success-soft)] text-[var(--success)]"
          />
          <ReportCard
            title="Total Orders"
            value={totalOrders.toString()}
            subtitle={`${completedOrders} completed`}
            icon={ShoppingCart}
            color="bg-accent-soft text-accent"
          />
          <ReportCard
            title="Inventory Value"
            value={formatCurrency(totalInventoryValue)}
            subtitle={`${totalProducts} products`}
            icon={Package}
            color="bg-accent-soft text-accent"
          />
          <ReportCard
            title="Pending Orders"
            value={pendingOrders.toString()}
            subtitle="Awaiting completion"
            icon={Clock}
            color="bg-accent-soft text-accent"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Status Breakdown */}
          <div className="panel p-6">
            <h3 className="text-lg font-semibold text-text mb-4">Order Status Breakdown</h3>
            <div className="space-y-4">
              {[
                { status: 'Completed', count: orders.filter(o => o.orderStatus === 'completed').length, color: 'bg-[var(--success)]', total: completedOrders },
                { status: 'In Progress', count: orders.filter(o => ['packed', 'out_for_delivery', 'ready_for_pickup'].includes(o.orderStatus)).length, color: 'bg-accent', total: orders.filter(o => ['packed', 'out_for_delivery', 'ready_for_pickup'].includes(o.orderStatus)).length },
                { status: 'Pending', count: orders.filter(o => o.orderStatus === 'pending').length, color: 'bg-accent', total: orders.filter(o => o.orderStatus === 'pending').length },
                { status: 'Cancelled', count: orders.filter(o => o.orderStatus === 'cancelled').length, color: 'bg-danger-soft0', total: orders.filter(o => o.orderStatus === 'cancelled').length },
              ].map((item) => (
                <div key={item.status} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">{item.status}</span>
                    <span className="font-medium text-text">{item.count} orders</span>
                  </div>
                  <div className="w-full bg-surface-2 rounded-[var(--radius-pill)] h-2">
                    <div
                      className={`h-2 rounded-[var(--radius-pill)] ${item.color}`}
                      style={{ width: `${orders.length > 0 ? (item.count / orders.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Status Breakdown */}
          <div className="panel p-6">
            <h3 className="text-lg font-semibold text-text mb-4">Payment Status Breakdown</h3>
            <div className="space-y-4">
              {[
                { status: 'Paid', count: orders.filter(o => o.paymentStatus === 'paid').length, color: 'bg-[var(--success)]' },
                { status: 'Pending', count: orders.filter(o => o.paymentStatus === 'pending').length, color: 'bg-accent' },
                { status: 'Partial', count: orders.filter(o => o.paymentStatus === 'partial').length, color: 'bg-accent' },
                { status: 'Refunded', count: orders.filter(o => o.paymentStatus === 'refunded').length, color: 'bg-danger-soft0' },
              ].map((item) => (
                <div key={item.status} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-muted">{item.status}</span>
                    <span className="font-medium text-text">{item.count} orders</span>
                  </div>
                  <div className="w-full bg-surface-2 rounded-[var(--radius-pill)] h-2">
                    <div
                      className={`h-2 rounded-[var(--radius-pill)] ${item.color}`}
                      style={{ width: `${orders.length > 0 ? (item.count / orders.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="panel overflow-hidden">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-text">Transaction History</h3>
            <p className="text-sm text-text-muted">Recent financial transactions</p>
          </div>

          <div className="overflow-x-auto">
            <table className="data-table">
              <thead className="bg-surface-2 border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-muted uppercase">ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-muted uppercase">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-muted uppercase">Reference</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-muted uppercase">Items</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-text-muted uppercase">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-muted uppercase">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-muted uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTransactions.map((txn) => {
                  const Icon = getTransactionIcon(txn.type);
                  return (
                    <tr key={txn.id} className="hover:bg-surface-2">
                      <td className="px-6 py-4 text-sm text-text-muted font-medium">{txn.id}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`p-2 rounded-[var(--radius-input)] ${getTransactionColor(txn.type)}`}>
                            <Icon className="w-4 h-4" />
                          </span>
                          <span className="text-sm text-text capitalize">{txn.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-text font-medium">{txn.reference}</td>
                      <td className="px-6 py-4 text-sm text-text-muted">
                        {txn.items.map((item, idx) => (
                          <div key={idx} className="text-xs">
                            {item.name}: {item.quantity} x {formatCurrency(item.amount)}
                          </div>
                        ))}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-text">{formatCurrency(txn.total)}</td>
                      <td className="px-6 py-4 text-sm text-text-muted">{formatDate(txn.date)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-[var(--radius-pill)] text-xs font-medium ${getStatusColor(txn.status)}`}>
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
              <FileText className="w-12 h-12 text-text-subtle mx-auto mb-4" />
              <p className="text-text-muted">No transactions found</p>
            </div>
          )}
        </div>

        {/* Print-friendly report preview */}
        <div className="panel p-6 print:hidden">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-text">Print-Friendly Report Preview</h3>
              <p className="text-sm text-text-muted">How the report will look when printed</p>
            </div>
            <button
              onClick={handlePrint}
              className="btn-primary flex items-center gap-2"
            >
              <Printer className="w-5 h-5" />
              Print Now
            </button>
          </div>

          <div className="border-2 border-dashed border-border rounded-[var(--radius-input)] p-8 bg-surface-2">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-text">SMARTSTOCK</h2>
              <p className="text-text-muted">Glassram Glass and Aluminum Supply</p>
              <p className="text-sm text-text-subtle mt-2">Inventory & Sales Report</p>
              <p className="text-sm text-text-subtle">Generated: {new Date().toLocaleDateString()}</p>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="p-4 border border-border rounded-[var(--radius-input)] bg-surface">
                <p className="text-sm text-text-muted">Total Revenue</p>
                <p className="text-xl font-bold text-text">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="p-4 border border-border rounded-[var(--radius-input)] bg-surface">
                <p className="text-sm text-text-muted">Total Orders</p>
                <p className="text-xl font-bold text-text">{totalOrders}</p>
              </div>
              <div className="p-4 border border-border rounded-[var(--radius-input)] bg-surface">
                <p className="text-sm text-text-muted">Completed Orders</p>
                <p className="text-xl font-bold text-text">{completedOrders}</p>
              </div>
              <div className="p-4 border border-border rounded-[var(--radius-input)] bg-surface">
                <p className="text-sm text-text-muted">Pending Orders</p>
                <p className="text-xl font-bold text-text">{pendingOrders}</p>
              </div>
            </div>

          </div>
        </div>
      </div>
  );
};
