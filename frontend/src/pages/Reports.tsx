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
import { Layout } from '../components/Layout';
import { formatCurrency, formatDate, getStatusColor } from '../utils/helpers';
import { toast } from 'sonner';

// Last touched: 2026-07-07 (round 2 — demo polish)
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
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </div>
);

export const Reports: React.FC = () => {
  const { products, orders } = useData();
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
    toast.info('Opening browser print dialog…');
    window.print();
  };

  const handleExport = () => {
    toast.info('Export functionality - would download CSV/PDF');
  };

  const handleDatePill = (key: DateRange) => {
    setDateRange(key);
    toast.info('Demo data is static — date range is for display only.');
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
      case 'sale': return 'bg-green-100 text-green-600';
      case 'restock': return 'bg-blue-100 text-blue-600';
      case 'return': return 'bg-red-100 text-red-600';
      case 'adjustment': return 'bg-yellow-100 text-yellow-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fadeIn">
        {/* Header — title + generated-at + date pills */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
            <p className="text-sm text-gray-500 mt-1">
              Generated at: <span className="font-mono text-gray-700">{generatedAt}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2" aria-label="Date range">
            <Calendar className="w-4 h-4 text-gray-400" aria-hidden="true" />
            {DATE_PILLS.map((pill) => (
              <button
                key={pill.key}
                type="button"
                onClick={() => handleDatePill(pill.key)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  dateRange === pill.key
                    ? 'bg-amber-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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
            <button
              onClick={handleExport}
              className="btn-secondary flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Export
            </button>
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
            color="bg-green-100 text-green-600"
          />
          <ReportCard
            title="Total Orders"
            value={totalOrders.toString()}
            subtitle={`${completedOrders} completed`}
            icon={ShoppingCart}
            color="bg-blue-100 text-blue-600"
          />
          <ReportCard
            title="Inventory Value"
            value={formatCurrency(totalInventoryValue)}
            subtitle={`${totalProducts} products`}
            icon={Package}
            color="bg-purple-100 text-purple-600"
          />
          <ReportCard
            title="Pending Orders"
            value={pendingOrders.toString()}
            subtitle="Awaiting completion"
            icon={Clock}
            color="bg-yellow-100 text-yellow-600"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Status Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status Breakdown</h3>
            <div className="space-y-4">
              {[
                { status: 'Completed', count: orders.filter(o => o.orderStatus === 'completed').length, color: 'bg-green-500', total: completedOrders },
                { status: 'In Progress', count: orders.filter(o => ['packed', 'out_for_delivery', 'ready_for_pickup'].includes(o.orderStatus)).length, color: 'bg-blue-500', total: orders.filter(o => ['packed', 'out_for_delivery', 'ready_for_pickup'].includes(o.orderStatus)).length },
                { status: 'Pending', count: orders.filter(o => o.orderStatus === 'pending').length, color: 'bg-yellow-500', total: orders.filter(o => o.orderStatus === 'pending').length },
                { status: 'Cancelled', count: orders.filter(o => o.orderStatus === 'cancelled').length, color: 'bg-red-500', total: orders.filter(o => o.orderStatus === 'cancelled').length },
              ].map((item) => (
                <div key={item.status} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.status}</span>
                    <span className="font-medium text-gray-900">{item.count} orders</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${item.color}`} 
                      style={{ width: `${orders.length > 0 ? (item.count / orders.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Status Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Status Breakdown</h3>
            <div className="space-y-4">
              {[
                { status: 'Paid', count: orders.filter(o => o.paymentStatus === 'paid').length, color: 'bg-green-500' },
                { status: 'Pending', count: orders.filter(o => o.paymentStatus === 'pending').length, color: 'bg-yellow-500' },
                { status: 'Partial', count: orders.filter(o => o.paymentStatus === 'partial').length, color: 'bg-orange-500' },
                { status: 'Refunded', count: orders.filter(o => o.paymentStatus === 'refunded').length, color: 'bg-red-500' },
              ].map((item) => (
                <div key={item.status} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.status}</span>
                    <span className="font-medium text-gray-900">{item.count} orders</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${item.color}`} 
                      style={{ width: `${orders.length > 0 ? (item.count / orders.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
            <p className="text-sm text-gray-500">Recent financial transactions</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Reference</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Items</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTransactions.map((txn) => {
                  const Icon = getTransactionIcon(txn.type);
                  return (
                    <tr key={txn.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-500 font-medium">{txn.id}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`p-2 rounded-lg ${getTransactionColor(txn.type)}`}>
                            <Icon className="w-4 h-4" />
                          </span>
                          <span className="text-sm text-gray-900 capitalize">{txn.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{txn.reference}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {txn.items.map((item, idx) => (
                          <div key={idx} className="text-xs">
                            {item.name}: {item.quantity} x {formatCurrency(item.amount)}
                          </div>
                        ))}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900">{formatCurrency(txn.total)}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(txn.date)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(txn.status)}`}>
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
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No transactions found</p>
            </div>
          )}
        </div>

        {/* Print-friendly report preview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 print:hidden">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Print-Friendly Report Preview</h3>
              <p className="text-sm text-gray-500">How the report will look when printed</p>
            </div>
            <button
              onClick={handlePrint}
              className="btn-primary flex items-center gap-2"
            >
              <Printer className="w-5 h-5" />
              Print Now
            </button>
          </div>
          
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 bg-gray-50">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">SMARTSTOCK</h2>
              <p className="text-gray-500">Glassram Glass and Aluminum Supply</p>
              <p className="text-sm text-gray-400 mt-2">Inventory & Sales Report</p>
              <p className="text-sm text-gray-400">Generated: {new Date().toLocaleDateString()}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="p-4 border border-gray-200 rounded-lg bg-white">
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg bg-white">
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="text-xl font-bold text-gray-900">{totalOrders}</p>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg bg-white">
                <p className="text-sm text-gray-500">Completed Orders</p>
                <p className="text-xl font-bold text-gray-900">{completedOrders}</p>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg bg-white">
                <p className="text-sm text-gray-500">Pending Orders</p>
                <p className="text-xl font-bold text-gray-900">{pendingOrders}</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
};