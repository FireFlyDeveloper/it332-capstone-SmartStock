import React, { useEffect, useMemo, useState } from 'react';
// Last touched: 2026-07-17 (Phase 8 - backend analytics wiring)
import {
  TrendingUp,
  Package,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  PieChart,
  Sparkles,
  Brain,
  Zap,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { useData } from '../components/DataContext';
import { formatCurrency, checkStockStatus } from '../utils/helpers';
import { toast } from 'sonner';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart as RechartsPieChart,
  Pie,
} from 'recharts';
import {
  monthlySalesData,
  topItemsData,
  fastMovingItems,
  slowMovingItems,
  mockAIRecommendations,
} from '../data/mockData';
import {
  getAnalyticsForecast,
  getAnalyticsInsights,
  getAnalyticsMovement,
  getAnalyticsPurchases,
  getAnalyticsSalesTrends,
  type AnalyticsForecastResponse,
  type AnalyticsInsightsResponse,
  type AnalyticsMovementMetric,
  type AnalyticsPurchaseMetric,
  type AnalyticsSalesTrend,
} from '../api';

type DateRange = '7d' | '30d' | 'all';

type SalesChartPoint = {
  month: string;
  sales: number;
  orders: number;
};

type TopItemChartPoint = {
  name: string;
  quantity: number;
  category: string;
};

type MovementDisplayItem = {
  name: string;
  stock: number;
  status: 'backend' | 'healthy' | 'critical';
};

const DATE_PILLS: { key: DateRange; label: string }[] = [
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: 'all', label: 'All time' },
];

const ANALYTICS_YEAR = new Date().getFullYear();
const MOVEMENT_THRESHOLD = 50;
const FORECAST_ALPHA = 0.35;

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : 'Analytics endpoint unavailable';
}

function toSalesChartData(trends: AnalyticsSalesTrend[]): SalesChartPoint[] {
  return trends.map((trend) => ({
    month: trend.month,
    sales: trend.grossSales,
    orders: trend.transactionCount,
  }));
}

function inferCategory(materialType: string): string {
  return materialType.toLowerCase().includes('aluminum') ? 'aluminum' : 'glass';
}

function toTopItemData(purchases: AnalyticsPurchaseMetric[]): TopItemChartPoint[] {
  return purchases
    .map((purchase) => ({
      name: purchase.supplier ? `${purchase.materialType} - ${purchase.supplier}` : purchase.materialType,
      quantity: purchase.totalQuantity,
      category: inferCategory(purchase.materialType),
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);
}

function toMovementDisplayItems(
  movements: AnalyticsMovementMetric[],
  classification: AnalyticsMovementMetric['classification'],
): MovementDisplayItem[] {
  return movements
    .filter((movement) => movement.classification === classification)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)
    .map((movement) => ({
      name: movement.month,
      stock: movement.quantity,
      status: 'backend',
    }));
}

export const Analytics: React.FC = () => {
  const { products, orders } = useData();
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [salesTrends, setSalesTrends] = useState<AnalyticsSalesTrend[]>([]);
  const [purchaseMetrics, setPurchaseMetrics] = useState<AnalyticsPurchaseMetric[]>([]);
  const [movementMetrics, setMovementMetrics] = useState<AnalyticsMovementMetric[]>([]);
  const [forecastResult, setForecastResult] = useState<AnalyticsForecastResponse | null>(null);
  const [insights, setInsights] = useState<AnalyticsInsightsResponse | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAnalytics() {
      setAnalyticsLoading(true);
      setAnalyticsError(null);
      const errors: string[] = [];

      let trends: AnalyticsSalesTrend[] = [];
      try {
        trends = await getAnalyticsSalesTrends();
        if (!cancelled) setSalesTrends(trends);
      } catch (error) {
        errors.push(`sales trends: ${formatError(error)}`);
        if (!cancelled) setSalesTrends([]);
      }

      const forecastQuantities = trends.length > 0
        ? trends.map((trend) => trend.transactionCount)
        : monthlySalesData.map((point) => point.orders);

      const [purchasesResult, movementResult, forecastResponse, insightsResult] = await Promise.allSettled([
        getAnalyticsPurchases(ANALYTICS_YEAR),
        getAnalyticsMovement(MOVEMENT_THRESHOLD),
        getAnalyticsForecast(forecastQuantities, FORECAST_ALPHA),
        getAnalyticsInsights(ANALYTICS_YEAR, MOVEMENT_THRESHOLD),
      ]);

      if (cancelled) return;

      if (purchasesResult.status === 'fulfilled') {
        setPurchaseMetrics(purchasesResult.value);
      } else {
        errors.push(`purchases: ${formatError(purchasesResult.reason)}`);
        setPurchaseMetrics([]);
      }

      if (movementResult.status === 'fulfilled') {
        setMovementMetrics(movementResult.value);
      } else {
        errors.push(`movement: ${formatError(movementResult.reason)}`);
        setMovementMetrics([]);
      }

      if (forecastResponse.status === 'fulfilled') {
        setForecastResult(forecastResponse.value);
      } else {
        errors.push(`forecast: ${formatError(forecastResponse.reason)}`);
        setForecastResult(null);
      }

      if (insightsResult.status === 'fulfilled') {
        setInsights(insightsResult.value);
      } else {
        errors.push(`insights: ${formatError(insightsResult.reason)}`);
        setInsights(null);
      }

      setAnalyticsError(errors.length > 0 ? `Using demo fallback for unavailable analytics data (${errors.join('; ')}).` : null);
      setAnalyticsLoading(false);
    }

    void loadAnalytics();

    return () => {
      cancelled = true;
    };
  }, []);

  const salesChartData = useMemo(
    () => (salesTrends.length > 0 ? toSalesChartData(salesTrends) : monthlySalesData),
    [salesTrends],
  );

  const topItems = useMemo(
    () => (purchaseMetrics.length > 0 ? toTopItemData(purchaseMetrics) : topItemsData),
    [purchaseMetrics],
  );

  const backendFastMovingItems = useMemo(
    () => toMovementDisplayItems(movementMetrics, 'fast_moving'),
    [movementMetrics],
  );

  const backendSlowMovingItems = useMemo(
    () => toMovementDisplayItems(movementMetrics, 'slow_moving'),
    [movementMetrics],
  );

  const fallbackFastMovingItems: MovementDisplayItem[] = fastMovingItems.map((item) => ({
    name: item.name,
    stock: item.stock,
    status: item.status === 'critical' ? 'critical' : 'healthy',
  }));
  const fallbackSlowMovingItems: MovementDisplayItem[] = slowMovingItems.map((item) => ({
    name: item.name,
    stock: item.stock,
    status: item.status === 'healthy' ? 'healthy' : 'critical',
  }));
  const displayedFastMovingItems = backendFastMovingItems.length > 0 ? backendFastMovingItems : fallbackFastMovingItems;
  const displayedSlowMovingItems = backendSlowMovingItems.length > 0 ? backendSlowMovingItems : fallbackSlowMovingItems;
  const isBackendAnalytics = salesTrends.length > 0 || purchaseMetrics.length > 0 || movementMetrics.length > 0 || forecastResult || insights;

  const forecastDateRange = salesChartData.length > 0
    ? `${salesChartData[0].month} - ${salesChartData[salesChartData.length - 1].month}`
    : 'No source period available';

  const fallbackForecastValue = salesChartData.length > 0
    ? Math.round(salesChartData.reduce((sum, point) => sum + point.orders, 0) / salesChartData.length)
    : 0;
  const displayedForecast = forecastResult?.forecast ?? fallbackForecastValue;
  const displayedAlpha = forecastResult?.alpha ?? FORECAST_ALPHA;

  // Calculate inventory stats
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0);
  const glassProducts = products.filter(p => p.category === 'glass');
  const aluminumProducts = products.filter(p => p.category === 'aluminum');
  const glassValue = glassProducts.reduce((sum, p) => sum + (p.stock * p.price), 0);
  const aluminumValue = aluminumProducts.reduce((sum, p) => sum + (p.stock * p.price), 0);
  const categoryTotalValue = glassValue + aluminumValue;

  // Stock status distribution for pie chart
  const stockDistribution = [
    { name: 'Healthy Stock', value: products.filter(p => checkStockStatus(p.stock, p.threshold) === 'healthy').length, color: '#22c55e' },
    { name: 'Low Stock', value: products.filter(p => checkStockStatus(p.stock, p.threshold) === 'low').length, color: '#eab308' },
    { name: 'Critical', value: products.filter(p => checkStockStatus(p.stock, p.threshold) === 'critical').length, color: '#ef4444' },
    { name: 'Out of Stock', value: products.filter(p => p.stock === 0).length, color: '#6b7280' }
  ].filter(item => item.value > 0);

  // Recent deterministic movement summary from live orders/products. Backend movement classifications feed the cards above.
  const inventoryMovements = products.slice(0, 8).map(product => {
    const orderedQty = orders
      .filter(o => o.orderStatus !== 'cancelled')
      .reduce((sum, o) => {
        const item = o.items.find(i => i.productId === product.id);
        return sum + (item?.quantity || 0);
      }, 0);
    return {
      productId: product.id,
      productName: product.name,
      category: product.category,
      inward: product.stock + orderedQty,
      outward: orderedQty,
      balance: product.stock
    };
  });

  const handleDatePill = (key: DateRange) => {
    setDateRange(key);
    toast.info(isBackendAnalytics ? 'Analytics data comes from backend metrics; use backend report filters for exact periods.' : 'Backend unavailable - showing demo analytics fallback.');
  };

  const renderMovingItems = (items: MovementDisplayItem[], tone: 'green' | 'yellow') => (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={`${item.name}-${index}`} className={`flex items-center justify-between p-3 ${tone === 'green' ? 'bg-[var(--success-soft)]' : 'bg-accent-soft'} rounded-[var(--radius-input)]`}>
          <div className="flex items-center gap-3">
            <span className={`w-8 h-8 ${tone === 'green' ? 'bg-[var(--success-soft)] text-[var(--success)]' : 'bg-accent-soft text-accent'} rounded-[var(--radius-pill)] flex items-center justify-center font-semibold text-sm`}>
              {index + 1}
            </span>
            <span className="font-medium text-text">{item.name}</span>
          </div>
          <div className="text-right">
            <span className="text-sm text-text-muted">{item.stock} units</span>
            <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
              item.status === 'backend'
                ? 'bg-accent-soft text-accent'
                : item.status === 'healthy'
                  ? 'bg-[var(--success-soft)] text-[var(--success)]'
                  : 'bg-danger-soft text-danger'
            }`}>
              {item.status === 'backend' ? 'backend' : item.status}
            </span>
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="text-sm text-text-muted">No movement records available.</p>}
    </div>
  );

  return (
      <div className="space-y-8 animate-fadeIn">
        {/* Date range pills + page title */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text">Analytics</h1>
            <p className="text-sm text-text-muted mt-1">Backend-assisted insights across inventory, sales, and demand.</p>
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

        {(analyticsLoading || analyticsError) && (
          <div className={`rounded-[var(--radius-card)] border p-4 ${analyticsError ? 'border-border bg-surface-2 text-accent' : 'border-border bg-accent-soft text-accent'}`}>
            <div className="flex items-start gap-3">
              {analyticsLoading ? <RefreshCw className="mt-0.5 h-5 w-5 animate-spin" /> : <AlertTriangle className="mt-0.5 h-5 w-5" />}
              <div>
                <p className="font-semibold">{analyticsLoading ? 'Loading backend analytics...' : 'Analytics fallback active'}</p>
                <p className="text-sm">{analyticsLoading ? 'Fetching sales trends, purchases, movement classifications, forecast, and recommendations.' : analyticsError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="panel p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Total Inventory Value</p>
                <p className="text-2xl font-bold text-text mt-1">{formatCurrency(totalInventoryValue)}</p>
              </div>
              <div className="p-3 bg-surface-2 rounded-[var(--radius-card)]">
                <TrendingUp className="w-6 h-6 text-[var(--success)]" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-[var(--success)]">
              <ArrowUpRight className="w-4 h-4" />
              <span>Live inventory valuation</span>
            </div>
          </div>

          <div className="panel p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Sales Transactions</p>
                <p className="text-2xl font-bold text-text mt-1">{salesChartData.reduce((sum, point) => sum + point.orders, 0)}</p>
              </div>
              <div className="p-3 bg-surface-2 rounded-[var(--radius-card)]">
                <Package className="w-6 h-6 text-accent" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-accent">
              <ArrowUpRight className="w-4 h-4" />
              <span>{salesTrends.length > 0 ? 'From backend sales trends' : 'Demo fallback'}</span>
            </div>
          </div>

          <div className="panel p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Gross Sales</p>
                <p className="text-2xl font-bold text-text mt-1">
                  {formatCurrency(salesChartData.reduce((sum, point) => sum + point.sales, 0))}
                </p>
              </div>
              <div className="p-3 bg-surface-2 rounded-[var(--radius-card)]">
                <PieChart className="w-6 h-6 text-accent" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-[var(--success)]">
              <ArrowUpRight className="w-4 h-4" />
              <span>{forecastDateRange}</span>
            </div>
          </div>

          <div className="panel p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Low Stock Items</p>
                <p className="text-2xl font-bold text-text mt-1">
                  {products.filter(p => checkStockStatus(p.stock, p.threshold) !== 'healthy').length}
                </p>
              </div>
              <div className="p-3 bg-surface-2 rounded-[var(--radius-card)]">
                <AlertTriangle className="w-6 h-6 text-accent" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-accent">
              <Clock className="w-4 h-4" />
              <span>Needs attention</span>
            </div>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Sales Trend */}
          <div className="panel p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-text">Monthly Sales Trend</h3>
                <p className="text-sm text-text-muted">Revenue over time {salesTrends.length > 0 ? 'from backend' : '(demo fallback)'}</p>
              </div>
              <TrendingUp className="w-5 h-5 text-[var(--success)]" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={salesChartData}>
                <defs>
                  <linearGradient id="colorSales2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(value) => `₱${Number(value)/1000}k`} />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Sales']}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#0ea5e9" strokeWidth={2} fillOpacity={1} fill="url(#colorSales2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Orders per Month */}
          <div className="panel p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-text">Transactions per Month</h3>
                <p className="text-sm text-text-muted">Sales count tracking</p>
              </div>
              <Package className="w-5 h-5 text-accent" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  formatter={(value: number) => [value, 'Transactions']}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
                <Bar dataKey="orders" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Selling Items */}
          <div className="panel p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-text">Top Purchased Materials</h3>
                <p className="text-sm text-text-muted">Annual material purchases {purchaseMetrics.length > 0 ? 'from backend' : '(demo fallback)'}</p>
              </div>
              <Package className="w-5 h-5 text-accent" />
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topItems} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={100} />
                <Tooltip formatter={(value: number) => [value, 'Units']} />
                <Bar dataKey="quantity" fill="#0ea5e9" radius={[0, 4, 4, 0]}>
                  {topItems.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.category === 'glass' ? '#0ea5e9' : '#22c55e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Stock Status Distribution */}
          <div className="panel p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-text">Stock Status</h3>
                <p className="text-sm text-text-muted">Inventory health overview</p>
              </div>
              <AlertTriangle className="w-5 h-5 text-accent" />
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <RechartsPieChart>
                <Pie
                  data={stockDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {stockDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>

          {/* Category Value */}
          <div className="panel p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-text">Category Value</h3>
                <p className="text-sm text-text-muted">Inventory by category</p>
              </div>
              <PieChart className="w-5 h-5 text-accent" />
            </div>
            <div className="space-y-4 mt-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-text-muted">Glass Products</span>
                  <span className="font-semibold text-text">{formatCurrency(glassValue)}</span>
                </div>
                <div className="w-full bg-surface-2 rounded-[var(--radius-pill)] h-2">
                  <div className="bg-accent h-2 rounded-[var(--radius-pill)]" style={{ width: `${categoryTotalValue > 0 ? (glassValue / categoryTotalValue) * 100 : 0}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-text-muted">Aluminum Products</span>
                  <span className="font-semibold text-text">{formatCurrency(aluminumValue)}</span>
                </div>
                <div className="w-full bg-surface-2 rounded-[var(--radius-pill)] h-2">
                  <div className="bg-[var(--success)] h-2 rounded-[var(--radius-pill)]" style={{ width: `${categoryTotalValue > 0 ? (aluminumValue / categoryTotalValue) * 100 : 0}%` }} />
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-border">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Total Products</span>
                <span className="font-semibold text-text">{products.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Fast & Slow Moving Items */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fast Moving Items */}
          <div className="panel p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-surface-2 rounded-[var(--radius-input)]">
                <ArrowUpRight className="w-5 h-5 text-[var(--success)]" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text">Fast Moving Classification</h3>
                <p className="text-sm text-text-muted">Backend movement threshold: {MOVEMENT_THRESHOLD}</p>
              </div>
            </div>
            {renderMovingItems(displayedFastMovingItems, 'green')}
          </div>

          {/* Slow Moving Items */}
          <div className="panel p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-surface-2 rounded-[var(--radius-input)]">
                <Clock className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text">Slow Moving Classification</h3>
                <p className="text-sm text-text-muted">Low turnover periods from backend when available</p>
              </div>
            </div>
            {renderMovingItems(displayedSlowMovingItems, 'yellow')}
          </div>
        </div>

        {/* Inventory Movement Table */}
        <div className="panel p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-text">Inventory Movement Summary</h3>
              <p className="text-sm text-text-muted">Deterministic stock activity from live orders/products</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead className="bg-surface-2 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-text-muted uppercase">Category</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted uppercase">Estimated Inward</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted uppercase">Outward</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-text-muted uppercase">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {inventoryMovements.map((item) => (
                  <tr key={item.productId} className="hover:bg-surface-2">
                    <td className="px-4 py-3 text-sm text-text font-medium">{item.productName}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${item.category === 'glass' ? 'bg-accent-soft text-accent' : 'bg-[var(--success-soft)] text-[var(--success)]'}`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-[var(--success)] font-medium">{item.inward}</td>
                    <td className="px-4 py-3 text-right text-sm text-danger font-medium">{item.outward}</td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-text">{item.balance}</td>
                  </tr>
                ))}
                {inventoryMovements.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-text-muted">No live product movement data available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI-Powered Demand Forecasting */}
        <div className="bg-gradient-to-r from-[var(--accent-softer)] to-[var(--surface)] rounded-[var(--radius-card)] border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent-soft rounded-[var(--radius-input)]">
                <Brain className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text flex items-center gap-2">
                  SES Demand Forecast
                  <span className="px-2 py-0.5 bg-accent-soft text-accent rounded-[var(--radius-pill)] text-xs font-semibold">Planning Signal</span>
                </h3>
                <p className="text-sm text-text-muted">Forecast result from backend simple exponential smoothing when available.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Sparkles className="w-4 h-4" />
              <span>{forecastResult ? 'Backend forecast' : 'Fallback estimate'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
            <div className="rounded-[var(--radius-input)] bg-surface p-4 border border-border">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">Forecasted transactions</p>
              <p className="mt-2 text-3xl font-bold text-text">{Math.round(displayedForecast)}</p>
              <p className="mt-1 text-xs text-text-muted">Next-period SES value</p>
            </div>
            <div className="rounded-[var(--radius-input)] bg-surface p-4 border border-border">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">Date range</p>
              <p className="mt-2 text-lg font-semibold text-text">{forecastDateRange}</p>
              <p className="mt-1 text-xs text-text-muted">Source quantities: monthly transaction counts</p>
            </div>
            <div className="rounded-[var(--radius-input)] bg-surface p-4 border border-border">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">Smoothing alpha</p>
              <p className="mt-2 text-3xl font-bold text-text">{displayedAlpha.toFixed(2)}</p>
              <p className="mt-1 text-xs text-text-muted">Recommendation only, not custom-trained ML</p>
            </div>
          </div>

          {/* AI Recommendations */}
          <div>
            <h4 className="font-semibold text-text mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              AI Recommendations - recommendation only / planning signal
            </h4>
            <p className="mb-3 text-xs text-text-muted">
              These notes are decision-support signals from backend analytics ({insights?.source ?? 'demo fallback'}), not a custom-trained machine-learning model.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {insights ? (
                <>
                  <div className="bg-surface rounded-[var(--radius-input)] p-3 border border-border md:col-span-2">
                    <div className="flex items-start justify-between mb-1">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-accent-soft text-accent">{insights.confidence} confidence</span>
                      <span className="text-xs text-text-muted">{insights.source}</span>
                    </div>
                    <p className="text-sm font-medium text-text">Analytics Summary</p>
                    <p className="text-xs text-text-muted mt-1">{insights.summary}</p>
                  </div>
                  {insights.recommendations.slice(0, 3).map((recommendation, index) => (
                    <div key={`recommendation-${index}`} className="bg-surface rounded-[var(--radius-input)] p-3 border border-border">
                      <span className="px-2 py-0.5 rounded-[var(--radius-pill)] text-xs font-semibold bg-accent-soft text-accent">recommendation only</span>
                      <p className="text-sm font-medium text-text mt-2">Planning recommendation {index + 1}</p>
                      <p className="text-xs text-text-muted mt-1">{recommendation}</p>
                    </div>
                  ))}
                  {insights.risks.slice(0, 2).map((risk, index) => (
                    <div key={`risk-${index}`} className="bg-surface rounded-[var(--radius-input)] p-3 border border-[var(--danger-border)]">
                      <span className="px-2 py-0.5 rounded-[var(--radius-pill)] text-xs font-semibold bg-danger-soft text-danger">risk signal</span>
                      <p className="text-sm font-medium text-text mt-2">Risk {index + 1}</p>
                      <p className="text-xs text-text-muted mt-1">{risk}</p>
                    </div>
                  ))}
                </>
              ) : (
                mockAIRecommendations.slice(0, 4).map((rec) => (
                  <div key={rec.id} className="bg-surface rounded-[var(--radius-input)] p-3 border border-border">
                    <div className="flex items-start justify-between mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        rec.priority === 'high' ? 'bg-danger-soft text-danger' :
                        rec.priority === 'medium' ? 'bg-accent-soft text-accent' :
                        'bg-accent-soft text-accent'
                      }`}>
                        {rec.priority} priority
                      </span>
                      <span className="text-xs text-text-muted">recommendation only</span>
                    </div>
                    <p className="text-sm font-medium text-text">{rec.title}</p>
                    <p className="text-xs text-text-muted mt-1">{rec.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
  );
};
