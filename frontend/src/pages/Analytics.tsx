import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Last touched: 2026-09-22 (interactive date filter toolbar matching Reports & Sales)
import { 
  TrendingUp, 
  Package, 
  Clock, 
  AlertTriangle,
  ArrowUpRight,
  PieChart,
  Sparkles,
  Brain,
  TrendingDown,
  Minus,
  Zap,
  Calendar,
  X,
  Banknote
} from 'lucide-react';

import { useData } from '../components/DataContext';
import { formatCurrency, checkStockStatus, formatDateInput } from '../utils/helpers';
import { generateDemandForecast } from '../utils/aiHelpers';
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
  Legend
} from 'recharts';
import { 
  monthlySalesData, 
  topItemsData, 
  fastMovingItems, 
  slowMovingItems, 
  mockAIRecommendations 
} from '../data/mockData';

type DateRangePreset = '7d' | '30d' | 'all' | 'custom';

export const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const { products, orders } = useData();
  const [datePreset, setDatePreset] = useState<DateRangePreset>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

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
      toast.info('Showing all-time analytics.');
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

  // Dynamically filter orders based on selected date range
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (fromDate && order.date < fromDate) return false;
      if (toDate && order.date > toDate) return false;
      return true;
    });
  }, [orders, fromDate, toDate]);

  // AI Demand Forecasting
  const aiForecasts = useMemo(
    () => generateDemandForecast(products, filteredOrders.length > 0 ? filteredOrders : orders),
    [products, filteredOrders, orders]
  );

  // Calculate inventory stats
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0);
  const glassProducts = products.filter(p => p.category === 'glass');
  const aluminumProducts = products.filter(p => p.category === 'aluminum');
  const glassValue = glassProducts.reduce((sum, p) => sum + (p.stock * p.price), 0);
  const aluminumValue = aluminumProducts.reduce((sum, p) => sum + (p.stock * p.price), 0);

  const avgOrderValue = useMemo(() => {
    return filteredOrders.length > 0
      ? filteredOrders.reduce((sum, o) => sum + o.total, 0) / filteredOrders.length
      : 0;
  }, [filteredOrders]);

  const lowStockCount = useMemo(() => {
    return products.filter(p => checkStockStatus(p.stock, p.threshold) !== 'healthy').length;
  }, [products]);

  // Top Selling Items for bar chart - derived from filtered orders with fallback to topItemsData
  const topSellingItems = useMemo(() => {
    const productCounts: Record<string, { name: string; quantity: number; category: string }> = {};
    filteredOrders.forEach(o => {
      if (o.orderStatus === 'cancelled') return;
      o.items.forEach(i => {
        if (!productCounts[i.productId]) {
          const prod = products.find(p => p.id === i.productId);
          productCounts[i.productId] = {
            name: i.productName,
            quantity: 0,
            category: prod?.category || 'aluminum',
          };
        }
        productCounts[i.productId].quantity += i.quantity;
      });
    });

    const sorted = Object.values(productCounts)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const itemsToUse = sorted.length > 0 ? sorted : topItemsData.slice(0, 5);

    return itemsToUse.map(item => {
      let shortName = item.name
        .replace(/^Aluminum\s+/i, '')
        .replace(/\s*-\s*Bronze Finish/i, '')
        .replace('Roller Nylon Bearing', 'Roller Bearing')
        .replace('Tube Square', 'Tube Sq')
        .trim();
      if (shortName.length > 17) {
        shortName = shortName.slice(0, 15) + '…';
      }
      return {
        ...item,
        shortName,
        fullName: item.name,
      };
    });
  }, [filteredOrders, products]);

  // Stock status distribution for pie chart
  const stockDistribution = [
    { name: 'Healthy Stock', value: products.filter(p => checkStockStatus(p.stock, p.threshold) === 'healthy').length, color: '#22c55e' },
    { name: 'Low Stock', value: products.filter(p => checkStockStatus(p.stock, p.threshold) === 'low').length, color: '#eab308' },
    { name: 'Critical', value: products.filter(p => checkStockStatus(p.stock, p.threshold) === 'critical').length, color: '#ef4444' },
    { name: 'Out of Stock', value: products.filter(p => p.stock === 0).length, color: '#6b7280' }
  ].filter(item => item.value > 0);

  // Calculate inventory movements (mock calculation based on filtered orders)
  const inventoryMovements = useMemo(() => {
    return products.slice(0, 8).map(product => {
      const orderedQty = filteredOrders
        .filter(o => o.orderStatus !== 'cancelled')
        .reduce((sum, o) => {
          const item = o.items.find(i => i.productId === product.id);
          return sum + (item?.quantity || 0);
        }, 0);
      return {
        productId: product.id,
        productName: product.name,
        category: product.category,
        inward: Math.floor(Math.random() * 50) + 20,
        outward: orderedQty,
        balance: product.stock
      };
    });
  }, [products, filteredOrders]);

  // Dynamic sales and order trend data aggregated from filtered orders
  const salesTrendData = useMemo(() => {
    if (filteredOrders.length === 0) {
      return [];
    }
    const dates = filteredOrders.map(o => o.date).filter(Boolean).sort();
    if (dates.length === 0) return monthlySalesData;

    const minDate = dates[0];
    const maxDate = dates[dates.length - 1];
    const dayDiff = (new Date(maxDate).getTime() - new Date(minDate).getTime()) / (1000 * 60 * 60 * 24);

    // If viewing short date range (<= 31 days) with an active filter, group by day
    if (dayDiff <= 31 && (fromDate || toDate)) {
      const dayMap: Record<string, { label: string; sales: number; orders: number }> = {};
      filteredOrders.forEach(o => {
        const d = o.date;
        if (!dayMap[d]) {
          const parsed = new Date(d);
          const label = !isNaN(parsed.getTime())
            ? parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : d;
          dayMap[d] = { label, sales: 0, orders: 0 };
        }
        if (o.orderStatus !== 'cancelled') {
          dayMap[d].sales += o.total;
        }
        dayMap[d].orders += 1;
      });
      return Object.keys(dayMap).sort().map(d => ({
        month: dayMap[d].label,
        sales: dayMap[d].sales,
        orders: dayMap[d].orders,
      }));
    }

    // Default or multi-month view: group by YYYY-MM
    const monthMap: Record<string, { label: string; sales: number; orders: number }> = {};
    filteredOrders.forEach(o => {
      const m = o.date.slice(0, 7);
      if (!monthMap[m]) {
        const [yr, mo] = m.split('-');
        const monthDate = new Date(Number(yr), Number(mo) - 1, 1);
        const label = !isNaN(monthDate.getTime())
          ? monthDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
          : m;
        monthMap[m] = { label, sales: 0, orders: 0 };
      }
      if (o.orderStatus !== 'cancelled') {
        monthMap[m].sales += o.total;
      }
      monthMap[m].orders += 1;
    });

    const results = Object.keys(monthMap).sort().map(m => ({
      month: monthMap[m].label,
      sales: monthMap[m].sales,
      orders: monthMap[m].orders,
    }));

    return results.length > 0 ? results : monthlySalesData;
  }, [filteredOrders, fromDate, toDate]);

  const chartSalesData = salesTrendData.length > 0 ? salesTrendData : monthlySalesData;

  return (
      <div className="space-y-6 sm:space-y-8 animate-fadeIn">
        {/* Page Title Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-[-0.02em]">
              AI Analytics &amp; Forecasting
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              DeepSeek predictive modeling for glass, aluminum profiles, and order flow.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/daily-sales')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-50 text-[#4f46e5] hover:bg-indigo-100/80 border border-indigo-100 text-xs font-bold transition-all shadow-2xs self-start sm:self-auto"
          >
            <Banknote className="w-4 h-4" />
            <span>Daily Sales &amp; Cash Audit</span>
          </button>
        </div>


        {/* Filter Toolbar Card: Date Range (presets + specific From/To) */}
        <div className="bg-white rounded-[28px] p-5 sm:p-6 border border-[#f1f5f9] shadow-sm">
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
                <label htmlFor="analytics-from-date" className="text-xs font-bold text-slate-500 whitespace-nowrap">
                  From:
                </label>
                <input
                  id="analytics-from-date"
                  type="date"
                  value={fromDate}
                  onChange={(e) => handleFromDateChange(e.target.value)}
                  className="rounded-xl border border-slate-200/80 bg-slate-50/50 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:bg-white focus:border-[#4f46e5] focus:outline-none transition-all shadow-2xs"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <label htmlFor="analytics-to-date" className="text-xs font-bold text-slate-500 whitespace-nowrap">
                  To:
                </label>
                <input
                  id="analytics-to-date"
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

              <span className="text-xs font-semibold text-slate-400 pl-1 hidden sm:inline">
                ({filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'} analyzed)
              </span>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 1. Total Inventory Value */}
          <div className="bg-white rounded-[28px] shadow-sm border border-[#f1f5f9] p-6 micro-hover flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between gap-2 mb-4 min-w-0">

              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#10b981] flex items-center justify-center shrink-0 shadow-2xs">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold shrink-0 border border-emerald-100/60">
                <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                <span>+8.2% this month</span>
              </div>
            </div>
            <div className="space-y-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 truncate">
                Total Inventory Value
              </p>
              <div className="min-w-0">
                <span
                  title={formatCurrency(totalInventoryValue)}
                  className="text-2xl sm:text-[26px] font-black text-slate-900 tracking-tight leading-none truncate block"
                >
                  {formatCurrency(totalInventoryValue)}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Order Volume */}
          <div className="bg-white rounded-[28px] shadow-sm border border-[#f1f5f9] p-6 micro-hover flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between gap-2 mb-4 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-[#4f46e5] flex items-center justify-center shrink-0 shadow-2xs">
                <Package className="w-5 h-5" />
              </div>
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-[#4f46e5] text-xs font-bold shrink-0 border border-indigo-100/60">
                <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                <span>{fromDate || toDate ? `${filteredOrders.length} in range` : '+15% this quarter'}</span>
              </div>
            </div>
            <div className="space-y-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 truncate">
                Order Volume
              </p>
              <div className="min-w-0">
                <span
                  title={`${filteredOrders.length} orders`}
                  className="text-2xl sm:text-[26px] font-black text-slate-900 tracking-tight leading-none truncate block"
                >
                  {filteredOrders.length}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Average Order Value */}
          <div className="bg-white rounded-[28px] shadow-sm border border-[#f1f5f9] p-6 micro-hover flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between gap-2 mb-4 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 shadow-2xs">
                <PieChart className="w-5 h-5" />
              </div>
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold shrink-0 border border-emerald-100/60">
                <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                <span>+5% vs last month</span>
              </div>
            </div>
            <div className="space-y-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 truncate">
                Average Order Value
              </p>
              <div className="min-w-0">
                <span
                  title={formatCurrency(avgOrderValue)}
                  className="text-2xl sm:text-[26px] font-black text-slate-900 tracking-tight leading-none truncate block"
                >
                  {formatCurrency(avgOrderValue)}
                </span>
              </div>
            </div>
          </div>

          {/* 4. Low Stock Items */}
          <div className="bg-white rounded-[28px] shadow-sm border border-[#f1f5f9] p-6 micro-hover flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between gap-2 mb-4 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold shrink-0 border border-amber-100/60">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>Needs attention</span>
              </div>
            </div>
            <div className="space-y-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 truncate">
                Low Stock Items
              </p>
              <div className="min-w-0">
                <span
                  title={`${lowStockCount} items`}
                  className="text-2xl sm:text-[26px] font-black text-slate-900 tracking-tight leading-none truncate block"
                >
                  {lowStockCount}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Sales Trend */}
          <div className="bg-white rounded-[28px] shadow-sm border border-[#f1f5f9] p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Monthly Sales Trend</h3>
                <p className="text-xs text-slate-500">{fromDate || toDate ? 'Revenue for selected period' : 'Revenue over time'}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartSalesData}>
                <defs>
                  <linearGradient id="colorSales2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={{ stroke: '#f1f5f9' }} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={{ stroke: '#f1f5f9' }} tickFormatter={(value) => value >= 1000 ? `₱${Math.round(value/1000)}k` : `₱${value}`} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Sales']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #f1f5f9',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.08)',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}
                />
                <Area type="monotone" dataKey="sales" stroke="#0ea5e9" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Orders per Month */}
          <div className="bg-white rounded-[28px] shadow-sm border border-[#f1f5f9] p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Orders per Month</h3>
                <p className="text-xs text-slate-500">{fromDate || toDate ? 'Order volume for selected period' : 'Order volume tracking'}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#4f46e5] flex items-center justify-center shrink-0 shadow-2xs">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartSalesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={{ stroke: '#f1f5f9' }} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={{ stroke: '#f1f5f9' }} />
                <Tooltip 
                  formatter={(value: number) => [value, 'Orders']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #f1f5f9',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.08)',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}
                />
                <Bar dataKey="orders" fill="#22c55e" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Selling Items */}
          <div className="bg-white rounded-[28px] shadow-sm border border-[#f1f5f9] p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  {fromDate || toDate ? 'Top Selling Items' : 'Top Selling Items Annual'}
                </h3>
                <p className="text-xs text-slate-500">
                  {fromDate || toDate ? 'Top 5 purchased materials in selected range' : 'Annual most purchased materials (Top 5)'}
                </p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-[#4f46e5] flex items-center justify-center shrink-0 shadow-2xs">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={topSellingItems}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={{ stroke: '#f1f5f9' }} />
                <YAxis
                  dataKey="shortName"
                  type="category"
                  stroke="#64748b"
                  fontSize={11}
                  fontWeight={500}
                  width={110}
                  tickLine={false}
                  axisLine={{ stroke: '#f1f5f9' }}
                />
                <Tooltip
                  formatter={(value: number) => [`${value} units`, 'Sold']}
                  labelFormatter={(_label, payload) => payload?.[0]?.payload?.fullName || _label}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #f1f5f9',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.08)',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}
                />
                <Bar dataKey="quantity" fill="#0ea5e9" barSize={16} radius={[0, 8, 8, 0]}>
                  {topSellingItems.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.category === 'glass' ? '#0ea5e9' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Stock Status Distribution */}
          <div className="bg-white rounded-[28px] shadow-sm border border-[#f1f5f9] p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Stock Status</h3>
                <p className="text-xs text-slate-500">Inventory health overview</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <RechartsPieChart>
                <Pie
                  data={stockDistribution}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {stockDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [`${value} items`, name]}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #f1f5f9',
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.08)',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span className="text-xs font-medium text-slate-600 ml-1">{value}</span>}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>

          {/* Category Value */}
          <div className="bg-white rounded-[28px] shadow-sm border border-[#f1f5f9] p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Category Value</h3>
                <p className="text-xs text-slate-500">Inventory by category</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 shadow-2xs">
                <PieChart className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-4 mt-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600 font-medium">Glass Products</span>
                  <span className="font-bold text-slate-900">{formatCurrency(glassValue)}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-sky-500 h-2 rounded-full transition-all duration-500" style={{ width: `${(glassValue / (glassValue + aluminumValue)) * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600 font-medium">Aluminum Products</span>
                  <span className="font-bold text-slate-900">{formatCurrency(aluminumValue)}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${(aluminumValue / (glassValue + aluminumValue)) * 100}%` }} />
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-[#f1f5f9]">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Total Products</span>
                <span className="font-bold text-slate-900">{products.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Fast & Slow Moving Items */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fast Moving Items */}
          <div className="bg-white rounded-[28px] shadow-sm border border-[#f1f5f9] p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Fast Moving Items Monthly</h3>
                <p className="text-xs text-slate-500">Monthly high turnover products</p>
              </div>
            </div>
            <div className="space-y-3">
              {fastMovingItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100/40">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-white shadow-2xs rounded-full flex items-center justify-center text-emerald-600 font-bold text-xs">
                      {index + 1}
                    </span>
                    <span className="font-semibold text-slate-800 text-sm">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-500">{item.stock} in stock</span>
                    <span className={`ml-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${item.status === 'healthy' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Slow Moving Items */}
          <div className="bg-white rounded-[28px] shadow-sm border border-[#f1f5f9] p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Slow Moving Items</h3>
                <p className="text-xs text-slate-500">Low turnover products</p>
              </div>
            </div>
            <div className="space-y-3">
              {slowMovingItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-amber-50/40 rounded-2xl border border-amber-100/40">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-white shadow-2xs rounded-full flex items-center justify-center text-amber-600 font-bold text-xs">
                      {index + 1}
                    </span>
                    <span className="font-semibold text-slate-800 text-sm">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-500">{item.stock} in stock</span>
                    <span className={`ml-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${item.status === 'healthy' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Inventory Movement Table */}
        <div className="bg-white rounded-[28px] shadow-sm border border-[#f1f5f9] p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Inventory Movement Summary</h3>
              <p className="text-xs text-slate-500">Recent stock activity</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/80 border-b border-[#f1f5f9]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Inward</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Outward</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {inventoryMovements.map((item) => (
                  <tr key={item.productId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-900 font-medium">{item.productName}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${item.category === 'glass' ? 'bg-sky-50 text-sky-700 border border-sky-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-emerald-600 font-bold">{item.inward}</td>
                    <td className="px-4 py-3 text-right text-sm text-rose-600 font-bold">{item.outward}</td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">{item.balance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI-Powered Demand Forecasting */}
        <div className="bg-gradient-to-r from-violet-50/70 to-indigo-50/70 rounded-[28px] border border-violet-100/80 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center shadow-2xs">
                <Brain className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  AI Demand Forecasting
                  <span className="px-2.5 py-0.5 bg-violet-100 text-violet-700 rounded-full text-xs font-bold">ML Powered</span>
                </h3>
                <p className="text-xs text-slate-600">Predicted demand based on historical patterns</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Sparkles className="w-3.5 h-3.5 text-violet-500" />
              <span>Updated just now</span>
            </div>
          </div>
          
          {/* Demand Forecast Table */}
          <div className="bg-white rounded-2xl border border-violet-100/80 overflow-hidden mb-6 shadow-2xs">
            <table className="w-full">
              <thead className="bg-violet-50/70 border-b border-violet-100/80">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-violet-700 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-violet-700 uppercase tracking-wider">Current Stock</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-violet-700 uppercase tracking-wider">Predicted Demand</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-violet-700 uppercase tracking-wider">Days Until Stockout</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-violet-700 uppercase tracking-wider">Recommended Reorder</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-violet-700 uppercase tracking-wider">Trend</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-violet-700 uppercase tracking-wider">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {aiForecasts.slice(0, 6).map((forecast) => (
                  <tr key={forecast.productId} className="hover:bg-violet-50/30 transition-colors">
                    <td className="px-4 py-3 text-sm text-slate-900 font-medium">{forecast.productName}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">{forecast.currentStock}</td>
                    <td className="px-4 py-3 text-right text-sm text-slate-600">{forecast.predictedDemand}/mo</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        forecast.daysUntilStockout < 7 ? 'bg-rose-100 text-rose-700' :
                        forecast.daysUntilStockout < 14 ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {forecast.daysUntilStockout > 0 ? `${forecast.daysUntilStockout} days` : 'OK'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-violet-700">{forecast.recommendedReorderQty} units</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {forecast.trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-500" />}
                        {forecast.trend === 'down' && <TrendingDown className="w-4 h-4 text-rose-500" />}
                        {forecast.trend === 'stable' && <Minus className="w-4 h-4 text-slate-400" />}
                        <span className="text-xs font-semibold capitalize text-slate-600">{forecast.trend}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center">
                        <div className="w-16 bg-slate-100 rounded-full h-2 mr-2 overflow-hidden">
                          <div 
                            className="bg-violet-500 h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${forecast.confidence}%` }} 
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-600">{forecast.confidence}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* AI Recommendations */}
          <div>
            <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              AI Recommendations
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {mockAIRecommendations.slice(0, 4).map((rec) => (
                <div key={rec.id} className="bg-white rounded-2xl p-4 border border-violet-100 shadow-2xs">
                  <div className="flex items-start justify-between mb-1.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      rec.priority === 'high' ? 'bg-rose-100 text-rose-700' :
                      rec.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-sky-100 text-sky-700'
                    }`}>
                      {rec.priority} priority
                    </span>
                    <span className="text-xs font-semibold text-slate-400">{rec.type}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{rec.title}</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{rec.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
  );
};