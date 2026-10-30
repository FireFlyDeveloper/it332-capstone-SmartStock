import React, { useEffect, useMemo, useState } from 'react';
import {
  Package,
  TrendingUp,
  ShoppingBag,
  Truck,
  AlertTriangle,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { useData } from '../components/DataContext';
import { useAuth } from '../components/AuthContext';
import {
  getAnalyticsSalesTrends,
  getDashboardRecentActivity,
  type AnalyticsSalesTrend,
  type DashboardActivityRecord,
  type DashboardSalesRange,
} from '../api';
import { formatCurrency, formatCurrencyWhole } from '../utils/helpers';

import { InteractiveDonut, type DonutSegment } from '../components/InteractiveDonut';
import { RecentActivityTimeline } from '../components/RecentActivityTimeline';
import { OperationsInsightsBanner } from '../components/GlassPromoBanner';
import { QuickActionsGrid } from '../components/QuickActionsGrid';
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
} from 'recharts';

interface KpiCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ElementType;
  iconBoxBg: string;
  iconColor: string;
}

/**
 * 5-Column KPI Card
 * Spec:
 * - White background, responsive padding, rounded-3xl (28px radius)
 * - Icon in colored background box (12px radius)
 * - Label in 10px bold uppercase, tracking 0.08em
 * - Value sized to fit comfortably without clipping or overflowing
 * - Shows backend-derived KPI values without implying unverified trends.
 */
const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  unit,
  icon: Icon,
  iconBoxBg,
  iconColor,
}) => {
  return (
    <div className="bg-white rounded-[28px] p-4 sm:p-5 border border-[#f1f5f9] shadow-[0_2px_4px_-1px_rgb(0_0_0/0.04)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.02] hover:shadow-md flex flex-col justify-between group min-w-0 overflow-hidden">
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-2 mb-3 min-w-0">
          <div
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${iconBoxBg} ${iconColor} flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-2xs`}
          >
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>

        </div>

        {/* Label & KPI Value */}
        <div className="space-y-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400 truncate">
            {label}
          </p>
          <div className="flex items-baseline gap-1.5 min-w-0">
            <span
              title={typeof value === 'string' ? value : undefined}
              className="text-xl sm:text-2xl xl:text-[22px] 2xl:text-2xl font-black text-slate-900 tracking-tight leading-none truncate"
            >
              {value}
            </span>
            {unit && (
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                {unit}
              </span>
            )}
          </div>
        </div>
      </div>


    </div>
  );
};

function formatMonthLabel(month: string): string {
  const date = new Date(`${month}-01T00:00:00.000Z`);
  return Number.isNaN(date.getTime())
    ? month
    : date.toLocaleDateString(undefined, { month: 'short', year: '2-digit', timeZone: 'UTC' });
}

export const Dashboard: React.FC = () => {
  const { products, orders, deliverySummary, loading, error, refresh } = useData();
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState<DashboardSalesRange>('6M');
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);
  const [salesTrend, setSalesTrend] = useState<AnalyticsSalesTrend[]>([]);
  const [salesTrendLoading, setSalesTrendLoading] = useState(true);
  const [salesTrendError, setSalesTrendError] = useState<string | null>(null);
  const [recentActivity, setRecentActivity] = useState<DashboardActivityRecord[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setSalesTrendLoading(true);
    setSalesTrendError(null);
    getAnalyticsSalesTrends(timeRange)
      .then((rows) => { if (active) setSalesTrend(rows); })
      .catch((cause: unknown) => {
        if (active) setSalesTrendError(cause instanceof Error ? cause.message : 'Request failed');
      })
      .finally(() => { if (active) setSalesTrendLoading(false); });
    return () => { active = false; };
  }, [timeRange, dashboardRefreshKey]);

  useEffect(() => {
    let active = true;
    setActivityLoading(true);
    setActivityError(null);
    getDashboardRecentActivity()
      .then((rows) => { if (active) setRecentActivity(rows); })
      .catch((cause: unknown) => {
        if (active) setActivityError(cause instanceof Error ? cause.message : 'Request failed');
      })
      .finally(() => { if (active) setActivityLoading(false); });
    return () => { active = false; };
  }, [dashboardRefreshKey]);

  const totalStockAtListPrice = useMemo(
    () => products.reduce((sum, product) => sum + product.stock * product.price, 0),
    [products],
  );
  const lowStockItems = useMemo(
    () => products.filter((product) => product.status === 'active' && product.stock <= product.threshold).length,
    [products],
  );
  const activeOrders = useMemo(
    () => orders.filter((order) => !['completed', 'cancelled'].includes(order.orderStatus)).length,
    [orders],
  );
  const inTransitDeliveries = deliverySummary.inTransitCount;

  const monthlySales = useMemo(
    () => salesTrend.map((row) => ({ ...row, month: formatMonthLabel(row.month) })),
    [salesTrend],
  );
  const currentMonthOrderValue = monthlySales.at(-1)?.grossSales ?? 0;
  const totalOrderValueInRange = monthlySales.reduce((sum, row) => sum + row.grossSales, 0);
  const averageMonthlyOrderValue = monthlySales.length > 0
    ? Math.round(totalOrderValueInRange / monthlySales.length)
    : 0;

  const topItems = useMemo(() => {
    const productsById = new Map(products.map((product) => [product.id, product]));
    const itemMap = new Map<string, {
      productId: string;
      name: string;
      category: 'glass' | 'aluminum' | null;
      unit: string | null;
      quantity: number;
    }>();
    orders.forEach((order) => {
      if (order.orderStatus === 'cancelled') return;
      order.items.forEach((item) => {
        const product = productsById.get(item.productId);
        const existing = itemMap.get(item.productId) ?? {
          productId: item.productId,
          name: item.productName,
          category: product?.category ?? null,
          unit: product?.unit ?? null,
          quantity: 0,
        };
        existing.quantity += item.quantity;
        itemMap.set(item.productId, existing);
      });
    });
    return [...itemMap.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 4);
  }, [orders, products]);

  const activeProducts = useMemo(() => products.filter((product) => product.status === 'active'), [products]);
  const glassSkuCount = activeProducts.filter((product) => product.category === 'glass').length;
  const aluminumSkuCount = activeProducts.filter((product) => product.category === 'aluminum').length;
  const distributionData: DonutSegment[] = [
    { label: 'Glass products', shortLabel: 'Glass', value: glassSkuCount, color: '#10b981' },
    { label: 'Aluminum products', shortLabel: 'Aluminum', value: aluminumSkuCount, color: '#4f46e5' },
  ];

  const orderStatusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    orders.forEach((order) => counts.set(order.orderStatus, (counts.get(order.orderStatus) ?? 0) + 1));
    return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [orders]);
  const deliveryStatusCounts = ([
    ['pending', deliverySummary.pendingCount],
    ['in_transit', deliverySummary.inTransitCount],
    ['delivered', deliverySummary.deliveredCount],
  ] as [string, number][]).filter(([, count]) => count > 0).sort(([a], [b]) => a.localeCompare(b));

  const customTooltipFormatter = (value: number) => [formatCurrency(value), 'Gross order value'];

  const retryDashboard = () => {
    setDashboardRefreshKey((current) => current + 1);
    void refresh();
  };

  if (loading) {
    return <div role="status" className="rounded-3xl bg-white p-8 text-center text-slate-600">Loading dashboard data from backend…</div>;
  }
  if (error) {
    return (
      <div role="alert" className="rounded-3xl border border-rose-200 bg-white p-8 text-center">
        <p className="font-semibold text-rose-700">Could not load dashboard data: {error}</p>
        <button type="button" onClick={() => void refresh()} className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* ── 1. Greeting Header ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-[-0.02em]">
              Hello, {user?.name || 'there'} <span className="inline-block animate-wave">👋</span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
            Backend-sourced inventory, orders, and dispatch snapshot.
          </p>
        </div>

        {/* Date / Actions pill */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div className="flex items-center gap-2 px-3.5 py-2 bg-white rounded-2xl border border-[#f1f5f9] shadow-2xs text-xs font-bold text-slate-700">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <button
            type="button"
            onClick={retryDashboard}
            title="Refresh data from backend"
            className="p-2 rounded-2xl bg-white border border-[#f1f5f9] text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 shadow-2xs transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── 2. 5-Column KPI Row ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4 2xl:gap-5">
        {/* KPI 1: Current stock at listed unit prices */}
        <KpiCard
          label="STOCK AT LIST PRICE"
          value={formatCurrencyWhole(totalStockAtListPrice)}
          icon={Package}
          iconBoxBg="bg-indigo-50"
          iconColor="text-[#4f46e5]"
        />

        {/* KPI 2: Current-month gross order value */}
        <KpiCard
          label="THIS MONTH'S GROSS ORDER VALUE"
          value={salesTrendLoading ? 'Loading…' : salesTrendError ? 'Unavailable' : formatCurrencyWhole(currentMonthOrderValue)}
          icon={TrendingUp}
          iconBoxBg="bg-emerald-50"
          iconColor="text-[#10b981]"
        />

        {/* KPI 3: Active Orders (Blue/Info) */}
        <KpiCard
          label="ACTIVE ORDERS"
          value={activeOrders}
          unit="orders"
          icon={ShoppingBag}
          iconBoxBg="bg-blue-50"
          iconColor="text-[#3b82f6]"
        />

        {/* KPI 4: In-Transit Deliveries (Amber) */}
        <KpiCard
          label="IN TRANSIT"
          value={inTransitDeliveries}
          unit="deliveries"
          icon={Truck}
          iconBoxBg="bg-amber-50"
          iconColor="text-[#f59e0b]"
        />

        {/* KPI 5: Low Stock Alerts (Rose) */}
        <KpiCard
          label="LOW STOCK"
          value={lowStockItems}
          unit="products"
          icon={AlertTriangle}
          iconBoxBg="bg-rose-50"
          iconColor="text-[#f43f5e]"
        />
      </div>

      {/* ── 3. Main Analytics Area (12-col Grid) ────────────────────── */}
      <div className="space-y-6">
        {/* Top Row: (6-col) Line chart, (3-col) Donut chart, (3-col) Top items */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* (6-col) Line Chart for Monthly Trends with Interactive Nodes */}
          <div className="lg:col-span-6 bg-white rounded-[40px] p-6 sm:p-8 border border-[#f1f5f9] shadow-[0_4px_6px_-1px_rgb(0_0_0/0.05)] transition-all duration-300 hover:scale-[1.01] hover:shadow-md flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                    FINANCIAL OVERVIEW
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900 tracking-[-0.02em]">
                    Monthly Order Value
                  </h3>
                </div>

                {/* Interactive Time Range Toggle */}
                <div className="flex items-center gap-1 bg-[#f8fafc] p-1 rounded-2xl border border-slate-100 self-start">
                  {(['6M', '1Y', 'ALL'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setTimeRange(r)}
                      className={`px-3 py-1 text-xs font-bold rounded-xl transition-all ${
                        timeRange === r
                          ? 'bg-white text-[#4f46e5] shadow-xs'
                          : 'text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart with interactive nodes */}
              <div className="w-full h-[290px]">
                {salesTrendLoading ? (
                  <div role="status" className="flex h-full items-center justify-center text-sm text-slate-500">Loading order values…</div>
                ) : salesTrendError ? (
                  <div role="alert" className="flex h-full flex-col items-center justify-center gap-3 text-center text-sm text-rose-700">
                    <span>Could not load sales trend: {salesTrendError}</span>
                    <button type="button" onClick={retryDashboard} className="font-semibold text-indigo-600">Retry</button>
                  </div>
                ) : monthlySales.length === 0 || monthlySales.every((row) => row.transactionCount === 0) ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">No order records in this range.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                    data={monthlySales}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="indigoTrendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="month"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => `₱${val / 1000}k`}
                    />
                    <Tooltip
                      formatter={customTooltipFormatter}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #f1f5f9',
                        borderRadius: '16px',
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.08)',
                        fontSize: '12px',
                        fontWeight: '600',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="grossSales"
                      stroke="#4f46e5"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#indigoTrendGrad)"
                      activeDot={{
                        r: 6,
                        fill: '#4f46e5',
                        stroke: '#ffffff',
                        strokeWidth: 3,
                      }}
                    />
                  </AreaChart>
                  </ResponsiveContainer>
                  )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
              Gross order value from non-cancelled backend orders; includes unpaid/partial orders and does not deduct refunds.
            </div>
          </div>

          {/* (3-col) Donut Chart for Distribution with Custom Legend */}
          <div className="lg:col-span-3 bg-white rounded-[40px] p-6 sm:p-8 border border-[#f1f5f9] shadow-[0_4px_6px_-1px_rgb(0_0_0/0.05)] transition-all duration-300 hover:scale-[1.01] hover:shadow-md flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                DISTRIBUTION
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 tracking-[-0.02em] mb-4">
                Inventory by Product Category
              </h3>

              {/* Spec: Interactive Donut Chart with Centered Metrics & Legend */}
              <InteractiveDonut
                data={distributionData}
                totalLabel="ACTIVE SKUs"
                valueUnit="active SKUs"
                size={185}
              />
            </div>

            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 text-center font-medium">
              Active product counts by category; stock units are not mixed.
            </div>
          </div>

          {/* Top products by ordered quantity from backend orders */}
          <div className="lg:col-span-3 bg-white rounded-[40px] p-6 sm:p-8 border border-[#f1f5f9] shadow-[0_4px_6px_-1px_rgb(0_0_0/0.05)] transition-all duration-300 hover:scale-[1.01] hover:shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                    ORDER QUANTITY
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900 tracking-[-0.02em]">
                    Top Ordered Products
                  </h3>
                </div>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-3.5">
                {topItems.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-500">No non-cancelled order items are available.</p>
                ) : topItems.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0 ${item.category === 'glass' ? 'bg-blue-50 text-blue-600' : item.category === 'aluminum' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                        {item.category === 'glass' ? 'GL' : item.category === 'aluminum' ? 'AL' : '—'}
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-xs text-slate-800 truncate">{item.name}</p>
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          {item.category ?? 'Unclassified'}{item.unit ? ` · ${item.unit}` : ''}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 pl-2">
                      <span className="font-black text-xs text-slate-900">{item.quantity}</span>
                      <p className="text-[10px] text-slate-400 font-medium">{item.unit ?? 'ordered'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-xs text-slate-500">
              Ranked by quantity in non-cancelled backend orders.
            </div>
          </div>
        </div>

        {/* Bottom Row: (4-col) Timeline, (5-col) Bar chart with currency header, (3-col) Status summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* (4-col) Vertical Timeline for Recent Activity */}
          <div className="lg:col-span-4">
            <RecentActivityTimeline
              activities={recentActivity}
              loading={activityLoading}
              error={activityError}
              onRetry={() => setDashboardRefreshKey((current) => current + 1)}
            />
          </div>

          {/* (5-col) Vertical Bar Chart for Revenue with Large Currency Total */}
          <div className="lg:col-span-5 bg-white rounded-[40px] p-6 sm:p-8 border border-[#f1f5f9] shadow-[0_4px_6px_-1px_rgb(0_0_0/0.05)] transition-all duration-300 hover:scale-[1.01] hover:shadow-md flex flex-col justify-between">
            <div>
              {/* Header with large currency total */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                    OVERALL PERFORMANCE
                  </span>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Gross order value in selected range
                  </p>
                  {/* Large Currency Total */}
                  <div className="mt-2">
                    <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                      {salesTrendLoading ? 'Loading…' : salesTrendError ? 'Unavailable' : formatCurrency(totalOrderValueInRange)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Vertical Bar Chart */}
              <div className="w-full h-[230px] mt-2">
                {salesTrendLoading ? (
                  <div role="status" className="flex h-full items-center justify-center text-sm text-slate-500">Loading order values…</div>
                ) : salesTrendError ? (
                  <div role="alert" className="flex h-full items-center justify-center text-center text-sm text-rose-700">Could not load order values: {salesTrendError}</div>
                ) : monthlySales.length === 0 || monthlySales.every((row) => row.transactionCount === 0) ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">No order records in this range.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                    data={monthlySales}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="month"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `₱${v / 1000}k`}
                    />
                    <Tooltip
                      formatter={customTooltipFormatter}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #f1f5f9',
                        borderRadius: '16px',
                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.08)',
                        fontSize: '12px',
                        fontWeight: '600',
                      }}
                    />
                    <Bar dataKey="grossSales" radius={[8, 8, 0, 0]}>
                      {monthlySales.map((_, idx) => (
                        <Cell
                          key={`bar-${idx}`}
                          fill={idx === monthlySales.length - 1 ? '#10b981' : '#4f46e5'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Monthly average (zero-sales months included): {salesTrendLoading || salesTrendError ? '—' : formatCurrency(averageMonthlyOrderValue)}</span>
              <span className="font-extrabold text-slate-800">{salesTrendLoading || salesTrendError ? '—' : `${monthlySales.length} months in range`}</span>
            </div>
          </div>

          {/* Current order and delivery status counts from backend records */}
          <div className="lg:col-span-3 bg-white rounded-[40px] p-6 sm:p-8 border border-[#f1f5f9] shadow-[0_4px_6px_-1px_rgb(0_0_0/0.05)] flex flex-col">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                BACKEND DATA
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 tracking-[-0.02em] mb-4">
                Record Status
              </h3>

              <div className="space-y-5">
                <section aria-label="Order status counts">
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Orders</h4>
                  {orderStatusCounts.length === 0 ? (
                    <p className="text-xs text-slate-400">No order records.</p>
                  ) : (
                    <ul className="space-y-2">
                      {orderStatusCounts.map(([status, count]) => (
                        <li key={status} className="flex items-center justify-between gap-2 text-xs">
                          <span className="capitalize text-slate-600">{status.replaceAll('_', ' ')}</span>
                          <span className="font-bold text-slate-900">{count}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section aria-label="Delivery status counts">
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Deliveries</h4>
                  {deliveryStatusCounts.length === 0 ? (
                    <p className="text-xs text-slate-400">No delivery records.</p>
                  ) : (
                    <ul className="space-y-2">
                      {deliveryStatusCounts.map(([status, count]) => (
                        <li key={status} className="flex items-center justify-between gap-2 text-xs">
                          <span className="capitalize text-slate-600">{status.replaceAll('_', ' ')}</span>
                          <span className="font-bold text-slate-900">{count}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            </div>
            <p className="mt-auto border-t border-slate-100 pt-3 text-[11px] text-slate-400">
              Counts reflect current order and delivery records.
            </p>
          </div>
        </div>
      </div>

      {/* ── 4. Bottom Utility Section ───────────────────────────────── */}
      {/* A two-part grid: Left (8-col) Glassmorphism Promo Banner, Right (4-col) Actions Rapides */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <OperationsInsightsBanner />
        </div>
        <div className="lg:col-span-4">
          <QuickActionsGrid />
        </div>
      </div>
    </div>
  );
};