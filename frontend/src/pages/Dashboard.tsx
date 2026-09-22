import React, { useMemo, useState } from 'react';
import {
  Package,
  TrendingUp,
  ShoppingBag,
  Truck,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  Sparkles,
  Calendar,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useData } from '../components/DataContext';
import { formatCurrency, formatCurrencyWhole } from '../utils/helpers';
import { monthlySalesData, topItemsData } from '../data/mockData';
import { KpiSparkline } from '../components/KpiSparkline';
import { InteractiveDonut, type DonutSegment } from '../components/InteractiveDonut';
import { RecentActivityTimeline } from '../components/RecentActivityTimeline';
import { GlassPromoBanner } from '../components/GlassPromoBanner';
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
  change: string;
  isPositive?: boolean;
  icon: React.ElementType;
  iconBoxBg: string;
  iconColor: string;
  sparklineColor: string;
  sparklineData: number[];
  badgeBg?: string;
  badgeColor?: string;
}

/**
 * 5-Column KPI Card
 * Spec:
 * - White background, responsive padding, rounded-3xl (28px radius)
 * - Icon in colored background box (12px radius)
 * - Label in 10px bold uppercase, tracking 0.08em
 * - Value sized to fit comfortably without clipping or overflowing
 * - Percentage change badge (emerald-50 bg for positive)
 * - Bottom SVG sparkline smoothly interpolating points across width
 */
const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  unit,
  change,
  isPositive = true,
  icon: Icon,
  iconBoxBg,
  iconColor,
  sparklineColor,
  sparklineData,
  badgeBg = isPositive ? 'bg-emerald-50' : 'bg-rose-50',
  badgeColor = isPositive ? 'text-[#10b981]' : 'text-[#f43f5e]',
}) => {
  return (
    <div className="bg-white rounded-[28px] p-4 sm:p-5 border border-[#f1f5f9] shadow-[0_2px_4px_-1px_rgb(0_0_0/0.04)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.02] hover:shadow-md flex flex-col justify-between group min-w-0 overflow-hidden">
      <div className="min-w-0">
        {/* Top Icon Box + Change Badge */}
        <div className="flex items-center justify-between gap-2 mb-3 min-w-0">
          <div
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${iconBoxBg} ${iconColor} flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 shadow-2xs`}
          >
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>

          <div
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${badgeBg} ${badgeColor} text-[10px] sm:text-[11px] font-bold shrink-0 whitespace-nowrap`}
          >
            {isPositive ? (
              <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            ) : (
              <ArrowDownRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            )}
            <span>{change}</span>
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

      {/* Bottom Sparkline (36px height, smoothly interpolating) */}
      <div className="mt-3.5 pt-1 w-full overflow-hidden">
        <KpiSparkline
          data={sparklineData}
          color={sparklineColor}
          height={36}
        />
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const { products, orders, deliveries } = useData();
  const [timeRange, setTimeRange] = useState<'6M' | '1Y' | 'ALL'>('6M');

  // Real data calculations
  const totalInventoryValue = useMemo(
    () => products.reduce((sum, p) => sum + p.stock * p.price, 0),
    [products]
  );
  const lowStockItems = useMemo(
    () => products.filter((p) => p.stock <= p.threshold).length,
    [products]
  );
  const activeOrders = useMemo(
    () =>
      orders.filter(
        (o) => !['completed', 'cancelled'].includes(o.orderStatus)
      ).length,
    [orders]
  );
  const inTransitDeliveries = useMemo(
    () =>
      deliveries.filter((d) =>
        ['assigned', 'picked_up', 'in_transit', 'arrived'].includes(d.status)
      ).length,
    [deliveries]
  );

  // Sparkline data sets (7-10 points each)
  const sparkInventory = [2400, 2450, 2520, 2480, 2600, 2710, 2800, 2845];
  const sparkRevenue = [185, 210, 195, 280, 245, 320, 290, 335];
  const sparkOrders = [12, 15, 13, 18, 16, 22, 19, 21];
  const sparkDeliveries = [3, 4, 3, 5, 4, 6, 5, 6];
  const sparkLowStock = [8, 7, 9, 6, 8, 5, 6, 5];

  // Material category distribution for Donut Chart
  const glassTotalStock = useMemo(
    () =>
      products
        .filter((p) => p.category === 'glass')
        .reduce((sum, p) => sum + p.stock, 0),
    [products]
  );
  const aluminumTotalStock = useMemo(
    () =>
      products
        .filter((p) => p.category === 'aluminum')
        .reduce((sum, p) => sum + p.stock, 0),
    [products]
  );

  const distributionData: DonutSegment[] = [
    {
      label: 'Float & Tempered Glass',
      shortLabel: 'Glass',
      value: glassTotalStock || 540,
      color: '#10b981', // Emerald
    },
    {
      label: 'Aluminum Profiles',
      shortLabel: 'Aluminum',
      value: aluminumTotalStock || 360,
      color: '#4f46e5', // Indigo
    },
  ];

  // Custom tooltips
  const customTooltipFormatter = (value: number) => [
    formatCurrency(value),
    'Revenue',
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* ── 1. Greeting Header ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-[-0.02em]">
              Hello, Kim <span className="inline-block animate-wave">👋</span>
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-[#4f46e5] text-xs font-bold border border-indigo-100/80">
              <Sparkles className="w-3.5 h-3.5" />
              Glassram Supply
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-normal">
            Real-time overview of your glass, aluminum inventory, and dispatch operations.
          </p>
        </div>

        {/* Date / Actions pill */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div className="flex items-center gap-2 px-3.5 py-2 bg-white rounded-2xl border border-[#f1f5f9] shadow-2xs text-xs font-bold text-slate-700">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Tuesday, September 22, 2026</span>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            title="Refresh data"
            className="p-2 rounded-2xl bg-white border border-[#f1f5f9] text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 shadow-2xs transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── 2. 5-Column KPI Row ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4 2xl:gap-5">
        {/* KPI 1: Inventory Value (Indigo) */}
        <KpiCard
          label="INVENTORY VALUE"
          value={formatCurrencyWhole(totalInventoryValue || 2845000)}
          change="+8.4%"
          isPositive={true}
          icon={Package}
          iconBoxBg="bg-indigo-50"
          iconColor="text-[#4f46e5]"
          sparklineColor="#4f46e5"
          sparklineData={sparkInventory}
        />

        {/* KPI 2: Monthly Revenue (Emerald) */}
        <KpiCard
          label="MONTHLY SALES"
          value={formatCurrencyWhole(320000)}
          change="+18.2%"
          isPositive={true}
          icon={TrendingUp}
          iconBoxBg="bg-emerald-50"
          iconColor="text-[#10b981]"
          sparklineColor="#10b981"
          sparklineData={sparkRevenue}
        />

        {/* KPI 3: Active Orders (Blue/Info) */}
        <KpiCard
          label="ACTIVE ORDERS"
          value={activeOrders || 19}
          unit="orders"
          change="+12.0%"
          isPositive={true}
          icon={ShoppingBag}
          iconBoxBg="bg-blue-50"
          iconColor="text-[#3b82f6]"
          sparklineColor="#3b82f6"
          sparklineData={sparkOrders}
        />

        {/* KPI 4: In-Transit Deliveries (Amber) */}
        <KpiCard
          label="IN TRANSIT"
          value={inTransitDeliveries || 6}
          unit="trucks"
          change="+5.0%"
          isPositive={true}
          icon={Truck}
          iconBoxBg="bg-amber-50"
          iconColor="text-[#f59e0b]"
          sparklineColor="#f59e0b"
          sparklineData={sparkDeliveries}
        />

        {/* KPI 5: Low Stock Alerts (Rose) */}
        <KpiCard
          label="LOW STOCK"
          value={lowStockItems || 5}
          unit="alerts"
          change="-4.2%"
          isPositive={false}
          icon={AlertTriangle}
          iconBoxBg="bg-rose-50"
          iconColor="text-[#f43f5e]"
          sparklineColor="#f43f5e"
          sparklineData={sparkLowStock}
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
                    Monthly Sales &amp; Demand Trend
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
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={monthlySalesData}
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
                      dataKey="sales"
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
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Steady demand for tempered glass &amp; aluminum profiles</span>
              <span className="font-extrabold text-emerald-600">+24.5% quarterly peak</span>
            </div>
          </div>

          {/* (3-col) Donut Chart for Distribution with Custom Legend */}
          <div className="lg:col-span-3 bg-white rounded-[40px] p-6 sm:p-8 border border-[#f1f5f9] shadow-[0_4px_6px_-1px_rgb(0_0_0/0.05)] transition-all duration-300 hover:scale-[1.01] hover:shadow-md flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                DISTRIBUTION
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 tracking-[-0.02em] mb-4">
                Inventory Categories
              </h3>

              {/* Spec: Interactive Donut Chart with Centered Metrics & Legend */}
              <InteractiveDonut
                data={distributionData}
                totalLabel="ITEMS"
                size={185}
              />
            </div>

            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 text-center font-medium">
              Synchronized in real-time with inventory ledger
            </div>
          </div>

          {/* (3-col) List of Top-Performing Items with Avatars and Star Ratings */}
          <div className="lg:col-span-3 bg-white rounded-[40px] p-6 sm:p-8 border border-[#f1f5f9] shadow-[0_4px_6px_-1px_rgb(0_0_0/0.05)] transition-all duration-300 hover:scale-[1.01] hover:shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                    TOP SELLERS
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900 tracking-[-0.02em]">
                    Featured Items
                  </h3>
                </div>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                  <Star className="w-4 h-4 fill-amber-400" />
                </div>
              </div>

              {/* List with avatars & star ratings */}
              <div className="space-y-3.5">
                {topItemsData.slice(0, 4).map((item, idx) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar box */}
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0 ${
                          item.category === 'glass'
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-emerald-50 text-emerald-600'
                        }`}
                      >
                        {item.category === 'glass' ? 'GL' : 'AL'}
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-xs text-slate-800 truncate">
                          {item.name}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] uppercase font-bold text-slate-400">
                            {item.category}
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="text-[10px] font-extrabold text-amber-500 flex items-center gap-0.5">
                            ★ {(4.9 - idx * 0.1).toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 pl-2">
                      <span className="font-black text-xs text-slate-900">
                        {item.quantity}
                      </span>
                      <p className="text-[10px] text-slate-400 font-medium">units</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Fast turnover</span>
              <span className="font-extrabold text-[#4f46e5]">Top 4 Products</span>
            </div>
          </div>
        </div>

        {/* Bottom Row: (4-col) Timeline, (5-col) Bar chart with currency header, (3-col) Status summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* (4-col) Vertical Timeline for Recent Activity */}
          <div className="lg:col-span-4">
            <RecentActivityTimeline
              orders={orders}
              deliveries={deliveries}
              products={products}
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
                    Quarterly Revenue Performance
                  </p>
                  {/* Large Currency Total */}
                  <div className="flex items-baseline gap-3 mt-2">
                    <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                      ₱1,725,000
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-extrabold text-xs">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      +22.4%
                    </span>
                  </div>
                </div>
              </div>

              {/* Vertical Bar Chart */}
              <div className="w-full h-[230px] mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlySalesData}
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
                    <Bar dataKey="sales" radius={[8, 8, 0, 0]}>
                      {monthlySalesData.map((_, idx) => (
                        <Cell
                          key={`bar-${idx}`}
                          fill={
                            idx === monthlySalesData.length - 2
                              ? '#10b981' // Highlight peak month in Emerald
                              : idx === monthlySalesData.length - 1
                              ? '#4f46e5' // Current month Indigo
                              : '#94a3b8' // Subtle slate for history
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Monthly average: ₱246k</span>
              <span className="font-extrabold text-slate-800">7 Months Recorded</span>
            </div>
          </div>

          {/* (3-col) Status Summary with Centered Donut & Percentage Breakdown */}
          <div className="lg:col-span-3 bg-white rounded-[40px] p-6 sm:p-8 border border-[#f1f5f9] shadow-[0_4px_6px_-1px_rgb(0_0_0/0.05)] transition-all duration-300 hover:scale-[1.01] hover:shadow-md flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                SYSTEM HEALTH
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 tracking-[-0.02em] mb-3">
                Operational Status
              </h3>

              {/* Centered Donut Gauge */}
              <div className="flex flex-col items-center justify-center my-3">
                <div className="relative w-32 h-32 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      stroke="#f1f5f9"
                      strokeWidth="7"
                      fill="none"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      stroke="#10b981"
                      strokeWidth="7"
                      strokeDasharray="263.89"
                      strokeDashoffset="31.67"
                      strokeLinecap="round"
                      fill="none"
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-3xl font-black text-slate-900 leading-none tracking-tight">88%</span>
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 mt-1">
                      SCORE
                    </span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-500 mt-2">Overall Health Index</span>
              </div>

              {/* Percentage breakdown */}
              <div className="space-y-3 mt-3">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-slate-600 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Delivered on-time
                    </span>
                    <span className="font-black text-slate-900">94%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '94%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-slate-600 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      Stock health
                    </span>
                    <span className="font-black text-slate-900">82%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: '82%' }} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-slate-600 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      Route efficiency
                    </span>
                    <span className="font-black text-slate-900">88%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: '88%' }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Glassram Reliability</span>
              <span className="font-extrabold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Optimal
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Bottom Utility Section ───────────────────────────────── */}
      {/* A two-part grid: Left (8-col) Glassmorphism Promo Banner, Right (4-col) Actions Rapides */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <GlassPromoBanner />
        </div>
        <div className="lg:col-span-4">
          <QuickActionsGrid />
        </div>
      </div>
    </div>
  );
};