import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Last touched: 2026-09-22 (interactive date filter toolbar matching Reports & Sales)
import { 
  TrendingUp, 
  Package, 
  Clock, 
  AlertTriangle,
  ArrowUpRight,
  PieChart,
  Calendar,
  X,
  Banknote
} from 'lucide-react';

import { useData } from '../components/DataContext';
import { formatCurrency, checkStockStatus, formatDateInput } from '../utils/helpers';
import { getDemandForecastPage, getProductsPage, type DemandForecastPageResponse, type DemandForecastProduct, type ProductsPageResponse } from '../api';
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

type DateRangePreset = '7d' | '30d' | 'all' | 'custom';

export const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const { products, orders, productsLoading, productsError, ordersLoading, ordersError, refreshProducts, refreshOrders } = useData();
  const [datePreset, setDatePreset] = useState<DateRangePreset>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [forecast, setForecast] = useState<DemandForecastProduct[]>([]);
  const [forecastLoading, setForecastLoading] = useState(true);
  const [forecastError, setForecastError] = useState('');
  const [forecastRefreshKey, setForecastRefreshKey] = useState(0);
  const [forecastPage, setForecastPage] = useState<DemandForecastPageResponse['page'] | null>(null);
  const [forecastLoadingMore, setForecastLoadingMore] = useState(false);
  const [forecastLoadMoreError, setForecastLoadMoreError] = useState('');
  const forecastSentinelRef = useRef<HTMLDivElement | null>(null);
  const forecastRequestRef = useRef(0);
  const forecastLoadingMoreRef = useRef(false);
  const [snapshotProducts, setSnapshotProducts] = useState<ProductsPageResponse['items']>([]);
  const [snapshotPage, setSnapshotPage] = useState<ProductsPageResponse['page'] | null>(null);
  const [snapshotLoading, setSnapshotLoading] = useState(true);
  const [snapshotLoadingMore, setSnapshotLoadingMore] = useState(false);
  const [snapshotError, setSnapshotError] = useState('');
  const [snapshotRetry, setSnapshotRetry] = useState(0);
  const snapshotSentinelRef = useRef<HTMLDivElement | null>(null);
  const snapshotRequestRef = useRef(0);
  const snapshotLoadingMoreRef = useRef(false);

  useEffect(() => {
    const requestId = ++snapshotRequestRef.current;
    setSnapshotProducts([]);
    setSnapshotPage(null);
    setSnapshotError('');
    setSnapshotLoading(true);
    snapshotLoadingMoreRef.current = false;
    setSnapshotLoadingMore(false);
    getProductsPage({ limit: 25 })
      .then((response) => {
        if (requestId !== snapshotRequestRef.current) return;
        setSnapshotProducts(response.items);
        setSnapshotPage(response.page);
      })
      .catch((error) => {
        if (requestId === snapshotRequestRef.current) setSnapshotError(error instanceof Error ? error.message : 'Could not load inventory snapshot.');
      })
      .finally(() => {
        if (requestId === snapshotRequestRef.current) setSnapshotLoading(false);
      });
    return () => {
      if (requestId === snapshotRequestRef.current) snapshotRequestRef.current += 1;
    };
  }, [products, snapshotRetry]);

  const loadMoreSnapshot = useCallback(async () => {
    if (!snapshotPage?.hasMore || !snapshotPage.nextCursor || snapshotLoading || snapshotLoadingMoreRef.current) return;
    const requestId = snapshotRequestRef.current;
    snapshotLoadingMoreRef.current = true;
    setSnapshotLoadingMore(true);
    setSnapshotError('');
    try {
      const response = await getProductsPage({ limit: 25, cursor: snapshotPage.nextCursor });
      if (requestId !== snapshotRequestRef.current) return;
      setSnapshotProducts((current) => [...current, ...response.items]);
      setSnapshotPage(response.page);
    } catch (error) {
      if (requestId === snapshotRequestRef.current) setSnapshotError(error instanceof Error ? error.message : 'Could not load more inventory.');
    } finally {
      if (requestId === snapshotRequestRef.current) {
        snapshotLoadingMoreRef.current = false;
        setSnapshotLoadingMore(false);
      }
    }
  }, [snapshotPage, snapshotLoading]);

  useEffect(() => {
    const sentinel = snapshotSentinelRef.current;
    if (!sentinel || !snapshotPage?.hasMore || snapshotLoading || snapshotLoadingMore || snapshotError || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) void loadMoreSnapshot();
    }, { rootMargin: '320px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [snapshotPage?.hasMore, snapshotLoading, snapshotLoadingMore, snapshotError, loadMoreSnapshot]);

  const handleDatePreset = (preset: '7d' | '30d' | 'all') => {
    setDatePreset(preset);
    if (preset === 'all') {
      setFromDate('');
      setToDate('');
      toast.info('Showing all-time analytics.');
    } else {
      const end = new Date();
      const start = new Date(end);
      const days = preset === '7d' ? 7 : 30;
      start.setDate(start.getDate() - (days - 1));
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

  useEffect(() => {
    const requestId = ++forecastRequestRef.current;
    setForecast([]);
    setForecastPage(null);
    setForecastLoading(true);
    setForecastError('');
    setForecastLoadMoreError('');
    forecastLoadingMoreRef.current = false;
    setForecastLoadingMore(false);
    getDemandForecastPage({ historyMonths: 12, limit: 25 })
      .then((result) => {
        if (requestId !== forecastRequestRef.current) return;
        setForecast(result.products);
        setForecastPage(result.page);
      })
      .catch((error) => {
        if (requestId === forecastRequestRef.current) setForecastError(error instanceof Error ? error.message : 'Could not load demand forecast.');
      })
      .finally(() => {
        if (requestId === forecastRequestRef.current) setForecastLoading(false);
      });
    return () => {
      if (requestId === forecastRequestRef.current) forecastRequestRef.current += 1;
    };
  }, [forecastRefreshKey]);

  const loadMoreForecast = useCallback(async () => {
    if (!forecastPage?.hasMore || !forecastPage.nextCursor || forecastLoading || forecastLoadingMoreRef.current) return;
    const requestId = forecastRequestRef.current;
    forecastLoadingMoreRef.current = true;
    setForecastLoadingMore(true);
    setForecastLoadMoreError('');
    try {
      const result = await getDemandForecastPage({ historyMonths: 12, limit: 25, cursor: forecastPage.nextCursor });
      if (requestId !== forecastRequestRef.current) return;
      setForecast((current) => [...current, ...result.products]);
      setForecastPage(result.page);
    } catch (error) {
      if (requestId === forecastRequestRef.current) setForecastLoadMoreError(error instanceof Error ? error.message : 'Could not load more forecast rows.');
    } finally {
      if (requestId === forecastRequestRef.current) {
        forecastLoadingMoreRef.current = false;
        setForecastLoadingMore(false);
      }
    }
  }, [forecastPage, forecastLoading]);

  useEffect(() => {
    const sentinel = forecastSentinelRef.current;
    if (!sentinel || !forecastPage?.hasMore || forecastLoading || forecastLoadingMore || forecastLoadMoreError || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) void loadMoreForecast();
    }, { rootMargin: '320px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [forecastPage?.hasMore, forecastLoading, forecastLoadingMore, forecastLoadMoreError, loadMoreForecast]);

  // Calculate inventory stats
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.stock * p.price), 0);
  const glassProducts = products.filter(p => p.category === 'glass');
  const aluminumProducts = products.filter(p => p.category === 'aluminum');
  const glassValue = glassProducts.reduce((sum, p) => sum + (p.stock * p.price), 0);
  const aluminumValue = aluminumProducts.reduce((sum, p) => sum + (p.stock * p.price), 0);
  const categoryListedPriceTotal = glassValue + aluminumValue;
  const glassListedPriceShare = categoryListedPriceTotal > 0 ? glassValue / categoryListedPriceTotal * 100 : 0;
  const aluminumListedPriceShare = categoryListedPriceTotal > 0 ? aluminumValue / categoryListedPriceTotal * 100 : 0;

  const nonCancelledOrders = useMemo(
    () => filteredOrders.filter(order => order.orderStatus !== 'cancelled'),
    [filteredOrders],
  );

  const avgOrderValue = useMemo(() => {
    return nonCancelledOrders.length > 0
      ? nonCancelledOrders.reduce((sum, order) => sum + order.total, 0) / nonCancelledOrders.length
      : 0;
  }, [nonCancelledOrders]);

  const lowStockCount = useMemo(() => {
    return products.filter(p => p.status === 'active' && checkStockStatus(p.stock, p.threshold) !== 'healthy').length;
  }, [products]);

  // Highest ordered quantities in the selected date range; not paid-sales volume.
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
            category: prod?.category ?? 'Unclassified',
          };
        }
        productCounts[i.productId].quantity += i.quantity;
      });
    });

    const sorted = Object.values(productCounts)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const itemsToUse = sorted;

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

  // Rank current catalog products by non-cancelled order quantities in recorded history.
  const { mostOrderedItems, leastOrderedItems } = useMemo(() => {
    const quantityByProduct: Record<string, number> = {};
    orders.forEach((o) => {
      if (o.orderStatus === 'cancelled') return;
      o.items.forEach((item) => {
        quantityByProduct[item.productId] = (quantityByProduct[item.productId] || 0) + item.quantity;
      });
    });

    const list = products.map((p) => ({
      name: p.name,
      category: p.category,
      stock: p.stock,
      unitsOrdered: quantityByProduct[p.id] || 0,
      status: checkStockStatus(p.stock, p.threshold),
    }));

    const mostOrdered = [...list]
      .filter((product) => product.unitsOrdered > 0)
      .sort((a, b) => b.unitsOrdered - a.unitsOrdered || a.name.localeCompare(b.name))
      .slice(0, 5);
    const leastOrdered = [...list]
      .sort((a, b) => a.unitsOrdered - b.unitsOrdered || a.name.localeCompare(b.name))
      .slice(0, 5);
    return { mostOrderedItems: mostOrdered, leastOrderedItems: leastOrdered };
  }, [products, orders]);

  // Rule-based stock alerts derived from current product levels and thresholds.
  const stockAlerts = useMemo(() => {
    const recs: Array<{ id: string; priority: 'high' | 'medium' | 'low'; type: string; title: string; description: string }> = [];
    const activeProducts = products.filter((product) => product.status === 'active');
    const outOfStockProds = activeProducts.filter((p) => p.stock <= 0);
    const criticalProds = activeProducts.filter((p) => checkStockStatus(p.stock, p.threshold) === 'critical');
    const lowProds = activeProducts.filter((p) => checkStockStatus(p.stock, p.threshold) === 'low');

    if (outOfStockProds.length > 0) {
      const product = outOfStockProds[0];
      recs.push({
        id: `rec-out-${product.id}`,
        priority: 'high',
        type: 'Out of Stock Alert',
        title: `No stock remaining for ${product.name}`,
        description: `Current stock is ${product.stock} ${product.unit}; review replenishment for this active product.`,
      });
    }
    if (criticalProds.length > 0) {
      recs.push({
        id: 'rec-crit',
        priority: 'high',
        type: 'Reorder Alert',
        title: `Immediate restock needed for ${criticalProds[0].name}`,
        description: `Current stock (${criticalProds[0].stock} ${criticalProds[0].unit}) is critically below the configured threshold (${criticalProds[0].threshold}).`,
      });
    }
    if (lowProds.length > 0) {
      recs.push({
        id: 'rec-low',
        priority: 'medium',
        type: 'Inventory Buffer',
        title: `Plan procurement for ${lowProds[0].name}`,
        description: `Stock level has reached the configured reorder threshold (${lowProds[0].stock} / ${lowProds[0].threshold} ${lowProds[0].unit}).`,
      });
    }
    return recs;
  }, [products]);

  const inventoryMovements = useMemo(() => {
    return snapshotProducts.map(product => {
      const orderedQty = filteredOrders
        .filter(o => o.orderStatus !== 'cancelled')
        .reduce((sum, o) => sum + o.items
          .filter(item => item.productId === product.id)
          .reduce((qty, item) => qty + item.quantity, 0), 0);
      return {
        productId: product.id,
        productName: product.name,
        category: product.category,
        stock: product.stock,
        orderedQty,
      };
    });
  }, [snapshotProducts, filteredOrders]);
  const availableForecastRows = useMemo(
    () => forecast.filter((item) => item.forecastQuantity !== null),
    [forecast],
  );

  // Dynamic sales and order trend data aggregated from filtered orders
  const salesTrendData = useMemo(() => {
    if (filteredOrders.length === 0) {
      return [];
    }
    const dates = filteredOrders.map(o => o.date).filter(Boolean).sort();
    if (dates.length === 0) return [];

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

    return results;
  }, [filteredOrders, fromDate, toDate]);

  const chartSalesData = salesTrendData;

  if (productsLoading || ordersLoading) {
    return <div role="status" className="rounded-3xl bg-white p-8 text-center text-slate-600">Loading analytics data from backend…</div>;
  }
  const sourceError = [productsError && `Products: ${productsError}`, ordersError && `Orders: ${ordersError}`].filter(Boolean).join('; ');
  if (sourceError) {
    return (
      <div role="alert" className="rounded-3xl border border-rose-200 bg-white p-8 text-center">
        <p className="font-semibold text-rose-700">Could not load analytics source data: {sourceError}</p>
        <button
          type="button"
          onClick={() => void Promise.allSettled([refreshProducts(), refreshOrders()])}
          className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
      <div className="space-y-6 sm:space-y-8 animate-fadeIn">
        {/* Page Title Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-[-0.02em]">
              Operations Analytics &amp; Demand Estimates
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Sales, stock, and order-history estimates from backend records. Demand estimates are rule-based, not AI-generated.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/daily-sales')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-50 text-[#4f46e5] hover:bg-indigo-100/80 border border-indigo-100 text-xs font-bold transition-all shadow-2xs self-start sm:self-auto"
          >
            <Banknote className="w-4 h-4" />
            <span>Daily Sales</span>
          </button>
        </div>


        {/* Filter Toolbar Card: Date Range (presets + specific From/To) */}
        <div className="bg-white rounded-[28px] p-5 sm:p-6 border border-[#f1f5f9] shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>Delivery Date Range:</span>
              </div>
              <select
                aria-label="Analytics date range"
                value={datePreset}
                onChange={(event) => {
                  const value = event.target.value as DateRangePreset;
                  if (value === 'custom') setDatePreset('custom');
                  else handleDatePreset(value);
                }}
                className="input w-full sm:w-44"
              >
                <option value="all">All time</option>
                <option value="30d">Last 30 days</option>
                <option value="7d">Last 7 days</option>
                <option value="custom">Custom range</option>
              </select>
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
          {/* 1. Stock at Listed Prices */}
          <div className="bg-white rounded-[28px] shadow-sm border border-[#f1f5f9] p-6 micro-hover flex flex-col justify-between min-w-0">
            <div className="flex items-center justify-between gap-2 mb-4 min-w-0">

              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#10b981] flex items-center justify-center shrink-0 shadow-2xs">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 truncate">
                Stock at Listed Prices
              </p>
              <div className="min-w-0">
                <span
                  title={formatCurrency(totalInventoryValue)}
                  className="text-2xl sm:text-[26px] font-black text-slate-900 tracking-tight leading-none truncate block"
                >
                  {formatCurrency(totalInventoryValue)}
                </span>
                <p className="mt-2 text-[10px] leading-relaxed text-slate-500">Current stock × listed selling price; not acquisition cost.</p>
              </div>
            </div>
          </div>

          {/* 2. Order Volume */}
          <div className="bg-white rounded-[28px] shadow-sm border border-[#f1f5f9] p-6 micro-hover flex flex-col justify-between min-w-0">
            <div className="flex items-center gap-2 mb-4 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-[#4f46e5] flex items-center justify-center shrink-0 shadow-2xs">
                <Package className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 truncate">
                Order Records
              </p>
              <div className="min-w-0">
                <span
                  title={`${filteredOrders.length} orders`}
                  className="text-2xl sm:text-[26px] font-black text-slate-900 tracking-tight leading-none truncate block"
                >
                  {filteredOrders.length}
                </span>
                <p className="mt-2 text-[10px] leading-relaxed text-slate-500">Includes cancelled order records.</p>
              </div>
            </div>
          </div>

          {/* 3. Average Gross Order Value */}
          <div className="bg-white rounded-[28px] shadow-sm border border-[#f1f5f9] p-6 micro-hover flex flex-col justify-between min-w-0">
            <div className="flex items-center gap-2 mb-4 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 shadow-2xs">
                <PieChart className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400 truncate">
                Average Gross Order Value
              </p>
              <div className="min-w-0">
                <span
                  title={formatCurrency(avgOrderValue)}
                  className="text-2xl sm:text-[26px] font-black text-slate-900 tracking-tight leading-none truncate block"
                >
                  {formatCurrency(avgOrderValue)}
                </span>
                <p className="mt-2 text-[10px] leading-relaxed text-slate-500">Non-cancelled order totals; unpaid/partial orders included, refunds not deducted.</p>
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
                Active Low Stock Items
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
          {/* Monthly Gross Order Value */}
          <div className="bg-white rounded-[28px] shadow-sm border border-[#f1f5f9] p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Monthly Gross Order Value</h3>
                <p className="text-xs text-slate-500">By delivery date; non-cancelled orders, including unpaid/partial amounts; refunds not deducted.</p>
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
                  formatter={(value: number) => [formatCurrency(value), 'Gross order value']}
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
                <h3 className="text-lg font-bold text-slate-900">Order Records per Month</h3>
                <p className="text-xs text-slate-500">By delivery date; count includes cancelled records.</p>
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
          {/* Top Ordered Products */}
          <div className="bg-white rounded-[28px] shadow-sm border border-[#f1f5f9] p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Top Ordered Products
                </h3>
                <p className="text-xs text-slate-500">
                  Top 5 quantities in non-cancelled orders for the selected delivery-date range; category uses current catalog metadata.
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
                  formatter={(value: number) => [`${value} units`, 'Ordered']}
                  labelFormatter={(_label, payload) => {
                    const item = payload?.[0]?.payload;
                    return `${item?.fullName || _label} · ${item?.category || 'Unclassified'}`;
                  }}
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
                    <Cell key={`cell-${index}`} fill={entry.category === 'glass' ? '#0ea5e9' : entry.category === 'aluminum' ? '#10b981' : '#94a3b8'} />
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

          {/* Stock at Listed Prices by Category */}
          <div className="bg-white rounded-[28px] shadow-sm border border-[#f1f5f9] p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">Stock at Listed Prices by Category</h3>
                <p className="text-xs text-slate-500">Inventory by category</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 shadow-2xs">
                <PieChart className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-4 mt-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600 font-medium">Glass stock at list price</span>
                  <span className="font-bold text-slate-900">{formatCurrency(glassValue)}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-sky-500 h-2 rounded-full transition-all duration-500" style={{ width: `${glassListedPriceShare}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600 font-medium">Aluminum stock at list price</span>
                  <span className="font-bold text-slate-900">{formatCurrency(aluminumValue)}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{ width: `${aluminumListedPriceShare}%` }} />
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

        {/* Relative order-quantity rankings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Most Ordered Products */}
          <div className="bg-white rounded-[28px] shadow-sm border border-[#f1f5f9] p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Most Ordered Products</h3>
                <p className="text-xs text-slate-500">All recorded non-cancelled orders; independent of the date filter.</p>
              </div>
            </div>
            <div className="space-y-3">
              {mostOrderedItems.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">No non-cancelled order quantities are available.</p> : mostOrderedItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100/40">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-white shadow-2xs rounded-full flex items-center justify-center text-emerald-600 font-bold text-xs">
                      {index + 1}
                    </span>
                    <span className="font-semibold text-slate-800 text-sm">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-500">{item.unitsOrdered} ordered · {item.stock} in stock</span>
                    <span className={`ml-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${item.status === 'healthy' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fewest Ordered Products */}
          <div className="bg-white rounded-[28px] shadow-sm border border-[#f1f5f9] p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Fewest Ordered Products</h3>
                <p className="text-xs text-slate-500">Zero means no matching orders in the recorded history.</p>
              </div>
            </div>
            <div className="space-y-3">
              {leastOrderedItems.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">No catalog products are available.</p> : leastOrderedItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-amber-50/40 rounded-2xl border border-amber-100/40">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-white shadow-2xs rounded-full flex items-center justify-center text-amber-600 font-bold text-xs">
                      {index + 1}
                    </span>
                    <span className="font-semibold text-slate-800 text-sm">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-500">{item.unitsOrdered} ordered · {item.stock} in stock</span>
                    <span className={`ml-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${item.status === 'healthy' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Inventory and order snapshot */}
        <div className="bg-white rounded-[28px] shadow-sm border border-[#f1f5f9] p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Inventory and Order Snapshot</h3>
              <p className="text-xs text-slate-500">Current backend stock compared with non-cancelled orders in the selected period</p>
            </div>
          </div>
          {snapshotPage && <p className="text-xs text-slate-400 -mt-4 mb-3">Showing {snapshotProducts.length} of {snapshotPage.totalCount} products</p>}
          {snapshotLoading && <div role="status" className="py-4 text-center text-sm text-slate-500">Loading inventory snapshot…</div>}
          {snapshotError && (
            <div role="alert" className="py-4 text-center text-sm text-rose-700">
              <p>{snapshotError}</p>
              <button type="button" onClick={() => setSnapshotRetry((value) => value + 1)} className="mt-2 font-bold underline">Retry</button>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/80 border-b border-[#f1f5f9]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Current Stock</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Units Ordered</th>
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
                    <td className="px-4 py-3 text-right text-sm text-emerald-600 font-bold">{item.stock}</td>
                    <td className="px-4 py-3 text-right text-sm text-rose-600 font-bold">{item.orderedQty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {snapshotPage?.hasMore && <div ref={snapshotSentinelRef} role="status" className="py-3 text-center text-xs text-slate-400">Scroll to load more products…</div>}
          {snapshotPage?.hasMore && typeof IntersectionObserver === 'undefined' && (
            <div className="py-3 text-center">
              <button type="button" onClick={() => void loadMoreSnapshot()} disabled={snapshotLoadingMore} className="text-sm font-semibold text-indigo-600 disabled:opacity-50">
                {snapshotLoadingMore ? 'Loading…' : 'Load more products'}
              </button>
            </div>
          )}
          {snapshotLoadingMore && <div role="status" className="py-3 text-center text-xs text-slate-400">Loading more products…</div>}
          {!snapshotLoading && !snapshotError && snapshotPage?.totalCount === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">No products are available.</p>
          )}
        </div>

        {/* Order-history demand estimates */}
        <div className="bg-gradient-to-r from-violet-50/70 to-indigo-50/70 rounded-[28px] border border-violet-100/80 p-6">
          <div hidden={!forecastLoading && !forecastError && availableForecastRows.length === 0}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center shadow-2xs">
                <Package className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Historical Demand Forecast</h3>
                <p className="text-xs text-slate-600">Delivered-order quantities grouped by order-creation month in UTC; estimates require at least three positive months.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Clock className="w-3.5 h-3.5 text-violet-500" />
              <span>Order-history forecast</span>
            </div>
          </div>
          
          <div className="mb-6 overflow-hidden rounded-2xl border border-violet-100/80 bg-white shadow-2xs">
            <div className="border-b border-violet-100 bg-violet-50/60 p-4 text-xs text-slate-600">
              Backend historical forecast: simple exponential smoothing (α=0.3), next-month horizon, using delivered-order quantities grouped by order-creation month in UTC (up to 12 months, including the current month to date). At least 3 positive-quantity months are required; sparse-history products are shown without an estimate.
            </div>
            {forecastLoading ? <p className="p-8 text-center text-sm text-slate-500">Loading historical forecast…</p> : forecastError ? <div role="alert" className="p-8 text-center text-sm text-rose-700"><p>{forecastError}</p><button type="button" onClick={() => setForecastRefreshKey((current) => current + 1)} className="mt-3 font-semibold text-indigo-600 hover:text-indigo-800">Retry</button></div> : availableForecastRows.length === 0 ? null : <div className="overflow-x-auto"><table className="w-full"><thead className="bg-violet-50/70"><tr><th className="px-4 py-3 text-left text-xs font-bold uppercase text-violet-700">Product</th><th className="px-4 py-3 text-right text-xs font-bold uppercase text-violet-700">Stock / reorder point</th><th className="px-4 py-3 text-right text-xs font-bold uppercase text-violet-700">Forecast next month</th><th className="px-4 py-3 text-right text-xs font-bold uppercase text-violet-700">Suggested order</th><th className="px-4 py-3 text-right text-xs font-bold uppercase text-violet-700">Coverage</th><th className="px-4 py-3 text-left text-xs font-bold uppercase text-violet-700">Policy assessment</th><th className="px-4 py-3 text-right text-xs font-bold uppercase text-violet-700">History</th></tr></thead><tbody className="divide-y divide-slate-100">{availableForecastRows.map(item => <tr key={item.productId}><td className="px-4 py-3"><p className="text-sm font-semibold text-slate-800">{item.name}</p><p className="text-xs text-slate-500">{item.sku} · {item.category}</p></td><td className="px-4 py-3 text-right text-sm text-slate-700">{item.currentStock} / {item.reorderPoint} {item.unit}</td><td className="px-4 py-3 text-right text-sm font-semibold text-slate-700">{item.forecastQuantity} {item.unit}</td><td className="px-4 py-3 text-right text-sm font-bold text-violet-700">{item.recommendedOrderQuantity === null ? '—' : `${item.recommendedOrderQuantity} ${item.unit}`}</td><td className="px-4 py-3 text-right text-sm text-slate-700">{item.stockCoverageDays === null ? '—' : `${item.stockCoverageDays} days`}</td><td className="px-4 py-3 text-sm text-slate-700">{item.policyAssessment.replaceAll('_', ' ')}</td><td className="px-4 py-3 text-right text-sm text-slate-500">{item.positiveMonths} positive months</td></tr>)}</tbody></table></div>}
          </div>
          {forecastPage && <p className="text-xs text-slate-500 mt-2">Showing {availableForecastRows.length} of {forecastPage.totalCount} products with sufficient history.</p>}
          {forecastPage?.hasMore && <div ref={forecastSentinelRef} role="status" className="py-3 text-center text-xs text-slate-400">Scroll to load more forecast rows…</div>}
          {forecastPage?.hasMore && typeof IntersectionObserver === 'undefined' && (
            <div className="py-3 text-center">
              <button type="button" onClick={() => void loadMoreForecast()} disabled={forecastLoadingMore} className="text-sm font-semibold text-indigo-600 disabled:opacity-50">
                {forecastLoadingMore ? 'Loading…' : 'Load more forecast rows'}
              </button>
            </div>
          )}
          {forecastLoadingMore && <div role="status" className="py-3 text-center text-xs text-slate-400">Loading more forecast rows…</div>}
          {forecastLoadMoreError && (
            <div role="alert" className="py-3 text-center text-sm text-rose-700">
              <p>{forecastLoadMoreError}</p>
              <button type="button" onClick={() => void loadMoreForecast()} className="mt-2 font-semibold text-indigo-600">Retry</button>
            </div>
          )}
          </div>
          
          {/* Rule-based stock alerts */}
          <div>
            <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Stock Alerts
            </h4>
            <p className="text-xs text-slate-500 mb-3">Based on current backend stock levels and configured reorder thresholds; not AI-generated.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {stockAlerts.slice(0, 4).map((rec) => (
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
              {stockAlerts.length === 0 && (
                <p className="text-sm text-slate-500 md:col-span-2">No active products currently meet the configured low-stock alert threshold.</p>
              )}
            </div>
          </div>
        </div>
      </div>
  );
};