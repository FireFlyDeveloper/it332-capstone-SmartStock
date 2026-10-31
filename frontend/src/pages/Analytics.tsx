import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Last touched: 2026-09-22 (interactive date filter toolbar matching Reports & Sales)
import { 
  TrendingUp, 
  Package, 
  Clock, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Calendar,
  X,
  Banknote
} from 'lucide-react';

import { formatCurrency, formatDateInput } from '../utils/helpers';
import InsightBreakdown from '../components/InsightBreakdown';
import { getAnalyticsInsights, getAnalyticsItemMovementPage, getAnalyticsMonthlyMovement, getAnalyticsOrderSummary, getDemandForecastPage, getProductsPage, type AnalyticsInsightsResponse, type AnalyticsMonthlyMovementResponse, type AnalyticsItemMovementPage, type AnalyticsOrderSummary, type DemandForecastPageResponse, type DemandForecastProduct, type ProductsPageResponse } from '../api';
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

function formatStockCheck(value: DemandForecastProduct['policyAssessment']): string {
  switch (value) {
    case 'below_reorder_point': return 'Below restock level';
    case 'below_forecast': return 'May run low';
    case 'adequate': return 'Stock looks adequate';
    case 'insufficient_history': return 'Not enough sales history';
  }
}

function isDiscreteUnit(unit: string): boolean {
  return /^(pcs|unit|units|box|boxes|set|sets|piece|pieces)$/i.test(unit.trim());
}

function formatPlanQuantity(value: number, unit: string): string {
  return `${isDiscreteUnit(unit) ? Math.ceil(value) : value} ${unit}`;
}

function describeFastMovingCutoff(threshold: number): string {
  if (!Number.isFinite(threshold) || threshold < 0) return 'a valid non-negative threshold';
  if (threshold === 0) return 'any recorded movement (products with none remain slow-moving)';
  return `at least ${threshold} ${threshold === 1 ? 'unit' : 'units'} sent out`;
}

function formatMonthlyLabel(month: string): string {
  const [year, number] = month.split('-').map(Number);
  return new Date(Date.UTC(year, number - 1, 1)).toLocaleDateString('en', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

function formatAnalyticsDateRange(fromDate: string, toDate: string): string {
  if (!fromDate && !toDate) return 'All time';
  return `${fromDate || 'Any date'} to ${toDate || 'Any date'}`;
}

function simplifyInsightText(text: string): string {
  return text
    .replace(/\bsimple exponential smoothing\s*(?:\(\s*SES\s*\))?\s*(?:demand\s+)?forecast\b/gi, 'sales estimate based on past orders')
    .replace(/\bsimple exponential smoothing\b/gi, 'sales estimate method')
    .replace(/\baggregated\b/gi, 'combined')
    .replace(/\baggregates\b/gi, 'overall totals')
    .replace(/\baggregate\b/gi, 'overall')
    .replace(/\bSES\b/gi, 'sales estimate')
    .replace(/\breorder points\b/gi, 'restock levels')
    .replace(/\breorder point\b/gi, 'restock level')
    .replace(/\breorder thresholds\b/gi, 'restock levels')
    .replace(/\breorder threshold\b/gi, 'restock level')
    .replace(/\boutbound stock movements\b/gi, 'stock sent out')
    .replace(/\boutbound movements\b/gi, 'stock sent out')
    .replace(/\boutbound\b/gi, 'sent out')
    .replace(/\bSKUs\b/g, 'products')
    .replace(/\bSKU\b/g, 'product code')
    .replace(/\blead times?\b/gi, 'time it takes to restock')
    .replace(/\breplenishment\b/gi, 'restocking')
    .replace(/\binventory turnover\b/gi, 'how often products sell')
    .replace(/\bstock coverage\b/gi, 'how long stock may last')
    .replace(/\bpolicy assessment\b/gi, 'stock check')
    .replace(/\bforecasts\b/gi, 'estimates')
    .replace(/\bforecast\b/gi, 'estimate')
    .replace(/\bprojected\b/gi, 'expected')
    .replace(/\bvolatility\b/gi, 'frequent changes')
    .replace(/\bshortfalls\b/gi, 'shortages')
    .replace(/\bshortfall\b/gi, 'shortage')
    .replace(/\bvariances\b/gi, 'differences')
    .replace(/\bvariance\b/gi, 'difference');
}

export const Analytics: React.FC = () => {
  const navigate = useNavigate();
  const [datePreset, setDatePreset] = useState<DateRangePreset>('all');
  const [monthlyMovement, setMonthlyMovement] = useState<AnalyticsMonthlyMovementResponse | null>(null);
  const [monthlyMovementUnit, setMonthlyMovementUnit] = useState('');
  const [monthlyMovementLoading, setMonthlyMovementLoading] = useState(true);
  const [monthlyMovementError, setMonthlyMovementError] = useState('');
  const [monthlyMovementRetry, setMonthlyMovementRetry] = useState(0);
  const monthlyMovementRequestRef = useRef(0);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [orderSummary, setOrderSummary] = useState<AnalyticsOrderSummary | null>(null);
  const [orderSummaryLoading, setOrderSummaryLoading] = useState(true);
  const [orderSummaryError, setOrderSummaryError] = useState('');
  const [orderSummaryRetry, setOrderSummaryRetry] = useState(0);
  const orderSummaryRequestRef = useRef(0);
  const [forecast, setForecast] = useState<DemandForecastProduct[]>([]);
  const [forecastLoading, setForecastLoading] = useState(true);
  const [forecastError, setForecastError] = useState('');
  const [forecastRefreshKey, setForecastRefreshKey] = useState(0);
  const [forecastPage, setForecastPage] = useState<DemandForecastPageResponse['page'] | null>(null);
  const [forecastLoadingMore, setForecastLoadingMore] = useState(false);
  const [forecastLoadMoreError, setForecastLoadMoreError] = useState('');
  const forecastSentinelRef = useRef<HTMLDivElement | null>(null);
  const forecastScrollerRef = useRef<HTMLDivElement | null>(null);
  const forecastRequestRef = useRef(0);
  const forecastLoadingMoreRef = useRef(false);
  const [snapshotProducts, setSnapshotProducts] = useState<ProductsPageResponse['items']>([]);
  const [snapshotPage, setSnapshotPage] = useState<ProductsPageResponse['page'] | null>(null);
  const [inventorySummary, setInventorySummary] = useState<ProductsPageResponse['summary'] | null>(null);
  const [inventorySummaryLoading, setInventorySummaryLoading] = useState(true);
  const [inventorySummaryError, setInventorySummaryError] = useState('');
  const [snapshotLoading, setSnapshotLoading] = useState(true);
  const [snapshotLoadingMore, setSnapshotLoadingMore] = useState(false);
  const [snapshotError, setSnapshotError] = useState('');
  const [snapshotRetry, setSnapshotRetry] = useState(0);
  const snapshotSentinelRef = useRef<HTMLDivElement | null>(null);
  const snapshotScrollerRef = useRef<HTMLDivElement | null>(null);
  const snapshotRequestRef = useRef(0);
  const snapshotLoadingMoreRef = useRef(false);
  const [movementThreshold, setMovementThreshold] = useState('10');
  const [movementRetry, setMovementRetry] = useState(0);
  const [movementRows, setMovementRows] = useState<AnalyticsItemMovementPage['rows']>([]);
  const [movementSummary, setMovementSummary] = useState<AnalyticsItemMovementPage['summary'] | null>(null);
  const [movementPage, setMovementPage] = useState<AnalyticsItemMovementPage['page'] | null>(null);
  const [movementLoading, setMovementLoading] = useState(true);
  const [movementLoadingMore, setMovementLoadingMore] = useState(false);
  const [movementError, setMovementError] = useState('');
  const [movementLoadMoreError, setMovementLoadMoreError] = useState('');
  const movementSentinelRef = useRef<HTMLDivElement | null>(null);
  const movementScrollerRef = useRef<HTMLDivElement | null>(null);
  const movementRequestRef = useRef(0);
  const movementLoadingMoreRef = useRef(false);
  const [aiInsight, setAiInsight] = useState<AnalyticsInsightsResponse | null>(null);
  const [aiInsightLoading, setAiInsightLoading] = useState(false);
  const [aiInsightError, setAiInsightError] = useState('');
  const [aiInsightCriteria, setAiInsightCriteria] = useState<{ fromDate: string; toDate: string; threshold: number } | null>(null);
  const aiInsightRequestRef = useRef(0);
  const aiInsightIsStale = !!aiInsightCriteria && (aiInsightCriteria.fromDate !== fromDate || aiInsightCriteria.toDate !== toDate || aiInsightCriteria.threshold !== Number(movementThreshold));

  useEffect(() => {
    aiInsightRequestRef.current += 1;
    setAiInsightLoading(false);
    setAiInsightError('');
  }, [fromDate, toDate, movementThreshold]);

  useEffect(() => {
    const requestId = ++monthlyMovementRequestRef.current;
    setMonthlyMovementLoading(true);
    setMonthlyMovementError('');
    getAnalyticsMonthlyMovement(12)
      .then((result) => {
        if (requestId !== monthlyMovementRequestRef.current) return;
        setMonthlyMovement(result);
        setMonthlyMovementUnit((current) => result.units.includes(current) ? current : result.units[0] ?? '');
      })
      .catch((error) => {
        if (requestId === monthlyMovementRequestRef.current) setMonthlyMovementError(error instanceof Error ? error.message : 'Could not load monthly stock movement.');
      })
      .finally(() => {
        if (requestId === monthlyMovementRequestRef.current) setMonthlyMovementLoading(false);
      });
    return () => {
      if (requestId === monthlyMovementRequestRef.current) monthlyMovementRequestRef.current += 1;
    };
  }, [monthlyMovementRetry]);

  useEffect(() => {
    const requestId = ++orderSummaryRequestRef.current;
    setOrderSummary(null);
    setOrderSummaryError('');
    setOrderSummaryLoading(true);
    getAnalyticsOrderSummary({ fromDate: fromDate || undefined, toDate: toDate || undefined })
      .then((summary) => {
        if (requestId === orderSummaryRequestRef.current) setOrderSummary(summary);
      })
      .catch((error) => {
        if (requestId === orderSummaryRequestRef.current) setOrderSummaryError(error instanceof Error ? error.message : 'Could not load Analytics order summary.');
      })
      .finally(() => {
        if (requestId === orderSummaryRequestRef.current) setOrderSummaryLoading(false);
      });
    return () => {
      if (requestId === orderSummaryRequestRef.current) orderSummaryRequestRef.current += 1;
    };
  }, [fromDate, toDate, orderSummaryRetry]);

  useEffect(() => {
    const requestId = ++snapshotRequestRef.current;
    setSnapshotProducts([]);
    setSnapshotPage(null);
    setInventorySummary(null);
    setInventorySummaryLoading(true);
    setInventorySummaryError('');
    setSnapshotError('');
    setSnapshotLoading(true);
    snapshotLoadingMoreRef.current = false;
    setSnapshotLoadingMore(false);
    getProductsPage({ limit: 25 })
      .then((response) => {
        if (requestId !== snapshotRequestRef.current) return;
        setSnapshotProducts(response.items);
        setSnapshotPage(response.page);
        setInventorySummary(response.summary);
      })
      .catch((error) => {
        if (requestId === snapshotRequestRef.current) {
          const message = error instanceof Error ? error.message : 'Could not load inventory summary.';
          setSnapshotError(message);
          setInventorySummaryError(message);
        }
      })
      .finally(() => {
        if (requestId === snapshotRequestRef.current) {
          setSnapshotLoading(false);
          setInventorySummaryLoading(false);
        }
      });
    return () => {
      if (requestId === snapshotRequestRef.current) snapshotRequestRef.current += 1;
    };
  }, [snapshotRetry]);

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
    }, { root: snapshotScrollerRef.current, rootMargin: '120px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [snapshotPage?.hasMore, snapshotLoading, snapshotLoadingMore, snapshotError, loadMoreSnapshot]);

  useEffect(() => {
    const requestId = ++movementRequestRef.current;
    const threshold = Number(movementThreshold);
    setMovementRows([]);
    setMovementSummary(null);
    setMovementPage(null);
    setMovementError('');
    setMovementLoadMoreError('');
    setMovementLoading(true);
    movementLoadingMoreRef.current = false;
    setMovementLoadingMore(false);

    if ((fromDate && !/^\d{4}-\d{2}-\d{2}$/.test(fromDate))
      || (toDate && !/^\d{4}-\d{2}-\d{2}$/.test(toDate))
      || (fromDate && toDate && fromDate > toDate)
      || movementThreshold.trim() === '' || !Number.isFinite(threshold) || threshold < 0) {
      setMovementError('Choose a valid date range and enter a non-negative number of units.');
      setMovementLoading(false);
      return () => {
        if (requestId === movementRequestRef.current) movementRequestRef.current += 1;
      };
    }

    getAnalyticsItemMovementPage({ fromDate: fromDate || undefined, toDate: toDate || undefined, allTime: !fromDate && !toDate, threshold, limit: 25 })
      .then((response) => {
        if (requestId !== movementRequestRef.current) return;
        setMovementRows(response.rows);
        setMovementSummary(response.summary);
        setMovementPage(response.page);
      })
      .catch((error) => {
        if (requestId === movementRequestRef.current) setMovementError(error instanceof Error ? error.message : 'Could not load product movement.');
      })
      .finally(() => {
        if (requestId === movementRequestRef.current) setMovementLoading(false);
      });
    return () => {
      if (requestId === movementRequestRef.current) movementRequestRef.current += 1;
    };
  }, [fromDate, toDate, movementThreshold, movementRetry]);

  const loadMoreMovement = useCallback(async () => {
    if (!movementPage?.hasMore || !movementPage.nextCursor || movementLoading || movementLoadingMoreRef.current) return;
    const threshold = Number(movementThreshold);
    const requestId = movementRequestRef.current;
    movementLoadingMoreRef.current = true;
    setMovementLoadingMore(true);
    setMovementLoadMoreError('');
    try {
      const response = await getAnalyticsItemMovementPage({ fromDate: fromDate || undefined, toDate: toDate || undefined, allTime: !fromDate && !toDate, threshold, limit: 25, cursor: movementPage.nextCursor });
      if (requestId !== movementRequestRef.current) return;
      setMovementRows((current) => [...current, ...response.rows]);
      setMovementSummary(response.summary);
      setMovementPage(response.page);
    } catch (error) {
      if (requestId === movementRequestRef.current) setMovementLoadMoreError(error instanceof Error ? error.message : 'Could not load more movement rows.');
    } finally {
      if (requestId === movementRequestRef.current) {
        movementLoadingMoreRef.current = false;
        setMovementLoadingMore(false);
      }
    }
  }, [movementPage, movementLoading, fromDate, toDate, movementThreshold]);

  useEffect(() => {
    const sentinel = movementSentinelRef.current;
    if (!sentinel || !movementPage?.hasMore || movementLoading || movementLoadingMore || movementLoadMoreError || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) void loadMoreMovement();
    }, { root: movementScrollerRef.current, rootMargin: '120px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [movementPage?.hasMore, movementLoading, movementLoadingMore, movementLoadMoreError, loadMoreMovement]);

  const generateInsights = useCallback(async () => {
    const threshold = Number(movementThreshold);
    if (movementThreshold.trim() === '' || !Number.isFinite(threshold) || threshold < 0) {
      setAiInsightError('Enter a valid number of units to mark a product as fast-moving.');
      return;
    }
    const requestId = ++aiInsightRequestRef.current;
    const criteria = { fromDate, toDate, threshold };
    setAiInsightError('');
    setAiInsightLoading(true);
    try {
      const result = await getAnalyticsInsights({ fromDate: fromDate || undefined, toDate: toDate || undefined, threshold });
      if (requestId === aiInsightRequestRef.current) {
        setAiInsight(result);
        setAiInsightCriteria(criteria);
      }
    } catch {
      if (requestId === aiInsightRequestRef.current) setAiInsightError('We could not prepare the summary. Please try again.');
    } finally {
      if (requestId === aiInsightRequestRef.current) setAiInsightLoading(false);
    }
  }, [fromDate, toDate, movementThreshold]);

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
    }, { root: forecastScrollerRef.current, rootMargin: '120px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [forecastPage?.hasMore, forecastLoading, forecastLoadingMore, forecastLoadMoreError, loadMoreForecast]);

  // Inventory statistics are aggregated by the backend over the full catalog.
  const totalInventoryValue = inventorySummary?.totalInventoryValue ?? 0;
  const glassValue = inventorySummary?.glassInventoryValue ?? 0;
  const aluminumValue = inventorySummary?.aluminumInventoryValue ?? 0;
  const categoryListedPriceTotal = glassValue + aluminumValue;
  const glassListedPriceShare = categoryListedPriceTotal > 0 ? glassValue / categoryListedPriceTotal * 100 : 0;
  const aluminumListedPriceShare = categoryListedPriceTotal > 0 ? aluminumValue / categoryListedPriceTotal * 100 : 0;

  const avgOrderValue = orderSummary?.averageOrderValue ?? 0;
  const lowStockCount = inventorySummary?.activeLowStockCount ?? 0;

  const topSellingItems = useMemo(() => (orderSummary?.topSellingItems ?? []).map((item) => {
    let shortName = item.name
      .replace(/^Aluminum\s+/i, '')
      .replace(/\s*-\s*Bronze Finish/i, '')
      .replace('Roller Nylon Bearing', 'Roller Bearing')
      .replace('Tube Square', 'Tube Sq')
      .trim();
    if (shortName.length > 17) shortName = shortName.slice(0, 15) + '…';
    return { ...item, shortName, fullName: item.name };
  }), [orderSummary]);

  const mostOrderedItems = orderSummary?.mostOrderedItems ?? [];
  const leastOrderedItems = orderSummary?.leastOrderedItems ?? [];


  const stockDistribution = [
    { name: 'Healthy Stock', value: inventorySummary?.healthyStockCount ?? 0, color: '#22c55e' },
    { name: 'Low Stock', value: inventorySummary?.lowStockStatusCount ?? 0, color: '#eab308' },
    { name: 'Critical', value: inventorySummary?.criticalStockCount ?? 0, color: '#ef4444' },
    { name: 'Out of Stock', value: inventorySummary?.outOfStockCount ?? 0, color: '#6b7280' },
  ].filter((item) => item.value > 0);

  const stockAlerts = useMemo(() => {
    const alerts = inventorySummary?.stockAlertProducts;
    const recs: Array<{ id: string; priority: 'high' | 'medium'; type: string; title: string; description: string }> = [];
    if (alerts?.outOfStock) {
      const product = alerts.outOfStock;
      recs.push({
        id: `rec-out-${product.id}`,
        priority: 'high',
        type: 'Out of stock',
        title: `No stock remaining for ${product.name}`,
        description: `This active product has no units left. Review whether it should be restocked.`,
      });
    }
    if (alerts?.critical) {
      const product = alerts.critical;
      recs.push({
        id: 'rec-crit',
        priority: 'high',
        type: 'Restock soon',
        title: `Restock ${product.name} as soon as possible`,
        description: `Only ${product.stock} ${product.unit} remain, below the restock level of ${product.threshold}.`,
      });
    }
    if (alerts?.low) {
      const product = alerts.low;
      recs.push({
        id: 'rec-low',
        priority: 'medium',
        type: 'Low stock',
        title: `Plan a restock for ${product.name}`,
        description: `Stock has reached its restock level (${product.stock} of ${product.threshold} ${product.unit}).`,
      });
    }
    return recs;
  }, [inventorySummary]);

  const inventoryMovements = useMemo(() => snapshotProducts.map((product) => ({
    productId: product.id,
    productName: product.name,
    category: product.category,
    stock: product.stock,
    unit: product.unit,
    threshold: product.threshold,
    orderedQty: orderSummary?.orderedQuantities[product.id] ?? 0,
  })), [snapshotProducts, orderSummary]);
  const availableForecastRows = useMemo(
    () => forecast.filter((item) => item.forecastQuantity !== null),
    [forecast],
  );

  const salesTrendData = orderSummary?.salesTrendData ?? [];
  const chartSalesData = salesTrendData;
  const salesTrendChange = salesTrendData.length >= 2 ? salesTrendData[salesTrendData.length - 1].sales - salesTrendData[salesTrendData.length - 2].sales : null;
  const orderTrendChange = salesTrendData.length >= 2 ? salesTrendData[salesTrendData.length - 1].orders - salesTrendData[salesTrendData.length - 2].orders : null;
  const monthlyMovementChartRows = monthlyMovement?.months.map((month) => {
    const row = monthlyMovement.rows.find((item) => item.month === month && item.unit === monthlyMovementUnit);
    return { month, inboundQuantity: row?.inboundQuantity ?? 0, outboundQuantity: row?.outboundQuantity ?? 0 };
  }) ?? [];

  if (inventorySummaryLoading || orderSummaryLoading) {
    return <div role="status" className="rounded-3xl bg-white p-8 text-center text-slate-600">Loading your analytics…</div>;
  }
  const sourceError = [inventorySummaryError && `Inventory summary: ${inventorySummaryError}`, orderSummaryError && `Order summary: ${orderSummaryError}`].filter(Boolean).join('; ');
  if (sourceError) {
    return (
      <div role="alert" className="rounded-3xl border border-rose-200 bg-white p-8 text-center">
        <p className="font-semibold text-rose-700">We could not load your analytics. Please try again.</p>
        <button
          type="button"
          onClick={() => {
            setSnapshotRetry((current) => current + 1);
            setOrderSummaryRetry((current) => current + 1);
          }}
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
              Business Insights &amp; Sales Estimates
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              See sales trends, stock levels, and product movement. Sales estimates use past orders and are separate from the AI summary.
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
                ({(orderSummary?.totalOrderCount ?? 0)} {(orderSummary?.totalOrderCount ?? 0) === 1 ? 'order' : 'orders'} analyzed)
              </span>
            </div>
          </div>
        </div>

        {/* Aggregate AI interpretation — forecasts are computed separately by SES */}
        <section className="space-y-4 rounded-[28px] border border-indigo-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">SmartStock Insights</h3>
              <p className="mt-1 max-w-3xl text-xs text-slate-500">Summarizes the selected delivery-date range, monthly stock movement, and all 13 analytics. No customer details or raw records are sent.</p>
            </div>
            <button type="button" onClick={() => void generateInsights()} disabled={aiInsightLoading} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60">
              {aiInsightLoading ? 'Preparing…' : aiInsight ? 'Refresh summary' : 'Get a quick summary'}
            </button>
          </div>
          {aiInsightIsStale && aiInsight && <p role="status" className="text-sm font-medium text-amber-700">These insights use earlier criteria and are out of date. Refresh the summary to apply the current filters.</p>}
          {aiInsightError && <p role="alert" className="text-sm text-rose-700">{aiInsightError}</p>}
          {aiInsightLoading && <p role="status" className="text-sm text-slate-500">Reviewing sales, purchases, and stock activity…</p>}
          {aiInsight && <div aria-live="polite" className="space-y-4 rounded-2xl bg-indigo-50/60 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-800">{aiInsight.source === 'fallback' ? 'SmartStock summary' : 'AI summary'}</span>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold capitalize text-slate-600">How sure: {aiInsight.confidence}</span>
              {aiInsightCriteria && <span className="text-xs text-slate-500">Selected dates: {formatAnalyticsDateRange(aiInsightCriteria.fromDate, aiInsightCriteria.toDate)} · Orders use delivery dates; stock movement uses UTC event dates · Fast-moving cutoff: {describeFastMovingCutoff(aiInsightCriteria.threshold)}</span>}
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wide text-slate-600">At a glance</h4>
              <p className="mt-2 text-sm leading-6 text-slate-800">{simplifyInsightText(aiInsight.summary)}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div><h4 className="text-xs font-bold uppercase tracking-wide text-slate-600">What you can do</h4><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">{aiInsight.recommendations.map((item, index) => <li key={`rec-${index}`}>{simplifyInsightText(item)}</li>)}</ul></div>
              <div><h4 className="text-xs font-bold uppercase tracking-wide text-slate-600">Things to watch</h4><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">{aiInsight.risks.map((item, index) => <li key={`risk-${index}`}>{simplifyInsightText(item)}</li>)}</ul></div>
            </div>
            <InsightBreakdown interpretations={aiInsight.interpretations} />
          </div>}
        </section>

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
                  title={`${(orderSummary?.totalOrderCount ?? 0)} orders`}
                  className="text-2xl sm:text-[26px] font-black text-slate-900 tracking-tight leading-none truncate block"
                >
                  {(orderSummary?.totalOrderCount ?? 0)}
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
                <h3 className="text-lg font-bold text-slate-900">Monthly Gross Order Value {salesTrendChange !== null && <span title="Change from the previous month" className={`ml-2 inline-flex items-center text-xs font-semibold ${salesTrendChange >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{salesTrendChange >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}{formatCurrency(Math.abs(salesTrendChange))} vs prior month</span>}</h3>
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
                <h3 className="text-lg font-bold text-slate-900">Order Records per Month {orderTrendChange !== null && <span title="Change from the previous month" className={`ml-2 inline-flex items-center text-xs font-semibold ${orderTrendChange >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{orderTrendChange >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}{Math.abs(orderTrendChange)} orders vs prior month</span>}</h3>
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
                data={topSellingItems.slice(0, 5)}
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
                <span className="font-bold text-slate-900">{inventorySummary?.totalProducts ?? 0}</span>
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
                <p className="text-xs text-slate-500">Top 5 only · all recorded non-cancelled orders; independent of the date filter.</p>
              </div>
            </div>
            <div className="space-y-3">
              {mostOrderedItems.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">No non-cancelled order quantities are available.</p> : mostOrderedItems.slice(0, 5).map((item, index) => (
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
                <h3 className="text-lg font-bold text-slate-900">Fewest Ordered Products · Bottom 5</h3>
                <p className="text-xs text-slate-500">Zero means no matching orders in the recorded history.</p>
              </div>
            </div>
            <div className="space-y-3">
              {leastOrderedItems.length === 0 ? <p className="py-6 text-center text-sm text-slate-500">No catalog products are available.</p> : leastOrderedItems.slice(0, 5).map((item, index) => (
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

        {/* Monthly stock movement by unit chart */}
        <section className="space-y-4 rounded-[28px] border border-sky-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Monthly Stock Inflow &amp; Outflow</h3>
              <p className="mt-1 text-xs text-slate-500">Last {monthlyMovement?.period.months ?? 12} UTC calendar months through this month · inbound and outbound quantities are shown separately and are never combined across units.</p>
              {monthlyMovement && <p className="mt-1 text-xs font-semibold text-slate-600">Period: {formatMonthlyLabel(monthlyMovement.period.startMonth)} – {formatMonthlyLabel(monthlyMovement.period.endMonth)} ({monthlyMovement.period.months} months; current month through today)</p>}
            </div>
            {monthlyMovement?.units.length ? <label className="text-xs font-semibold text-slate-600">Unit
              <select aria-label="Monthly movement unit" value={monthlyMovementUnit} onChange={(event) => setMonthlyMovementUnit(event.target.value)} className="input mt-1 block min-w-32">
                {monthlyMovement.units.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
              </select>
            </label> : null}
          </div>
          {monthlyMovementLoading && <p role="status" className="py-6 text-center text-sm text-slate-500">Loading monthly stock movement…</p>}
          {monthlyMovementError && <div role="alert" className="py-4 text-center text-sm text-rose-700"><p>{monthlyMovementError}</p><button type="button" onClick={() => setMonthlyMovementRetry((current) => current + 1)} className="mt-2 font-semibold text-indigo-600">Retry</button></div>}
          {!monthlyMovementLoading && !monthlyMovementError && (!monthlyMovement?.units.length || !monthlyMovementUnit) && <p className="py-6 text-center text-sm text-slate-500">No stock movement units are available for this period.</p>}
          {!monthlyMovementLoading && !monthlyMovementError && monthlyMovementUnit && <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div className="h-72 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyMovementChartRows}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tickFormatter={formatMonthlyLabel} stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip labelFormatter={(value) => formatMonthlyLabel(String(value))} formatter={(value: number, name: string) => [`${value} ${monthlyMovementUnit}`, name === 'inboundQuantity' ? 'Inbound' : 'Outbound']} />
                  <Legend formatter={(value) => value === 'inboundQuantity' ? 'Inbound' : 'Outbound'} />
                  <Bar dataKey="inboundQuantity" name="inboundQuantity" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="outboundQuantity" name="outboundQuantity" fill="#f97316" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-3 md:w-48 md:grid-cols-1">
              <div className="rounded-2xl bg-emerald-50 p-4"><p className="text-xs font-semibold text-emerald-700">Inbound · {monthlyMovementUnit}</p><p className="mt-1 text-2xl font-black text-emerald-900">{monthlyMovementChartRows.reduce((sum, row) => sum + row.inboundQuantity, 0)}</p></div>
              <div className="rounded-2xl bg-orange-50 p-4"><p className="text-xs font-semibold text-orange-700">Outbound · {monthlyMovementUnit}</p><p className="mt-1 text-2xl font-black text-orange-900">{monthlyMovementChartRows.reduce((sum, row) => sum + row.outboundQuantity, 0)}</p></div>
            </div>
          </div>}
        </section>

        {/* Item-level stock movement classification */}
        <section className="space-y-4 rounded-[28px] border border-sky-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Movement by Product</h3>
              <p className="mt-1 max-w-3xl text-xs text-slate-500">Shows units sent out during the selected Delivery Date Range, using each movement’s recorded UTC date. With All time selected, it shows all recorded movement. Products with no recorded movement are marked slow-moving; fast-moving uses the cutoff you choose.</p>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-xs font-semibold text-slate-600">Movement needed to count as fast-moving (in each item’s unit)
                <input aria-label="Movement required for fast-moving products" type="number" min="0" step="1" value={movementThreshold} onChange={(event) => setMovementThreshold(event.target.value)} className="input mt-1 block w-36" />
              </label>
            </div>
          </div>

          {movementSummary && <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-emerald-50 p-4"><p className="text-xs uppercase text-emerald-700">Fast-moving items</p><p className="mt-1 text-xl font-black text-emerald-900">{movementSummary.fastMovingCount}</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs uppercase text-slate-600">Slow-moving items</p><p className="mt-1 text-xl font-black text-slate-900">{movementSummary.slowMovingCount}</p></div>
            <div className="rounded-2xl bg-sky-50 p-4"><p className="text-xs uppercase text-sky-700">Units sent out · {formatAnalyticsDateRange(fromDate, toDate)}</p><p className="mt-1 text-sm font-black text-sky-900">{movementSummary.outboundByUnit.length ? movementSummary.outboundByUnit.map((item) => `${item.quantity} ${item.unit}`).join(' · ') : 'No stock sent out'}</p></div>
          </div>}

          {movementLoading && <p role="status" className="py-6 text-center text-sm text-slate-500">Loading product movement…</p>}
          {movementError && <div role="alert" className="py-4 text-center text-sm text-rose-700"><p>{movementError}</p><button type="button" onClick={() => setMovementRetry((current) => current + 1)} className="mt-2 font-semibold text-indigo-600">Retry</button></div>}
          {!movementLoading && !movementError && movementRows.length === 0 && <p className="py-6 text-center text-sm text-slate-500">No products are available for this report.</p>}
          {movementRows.length > 0 && <div ref={movementScrollerRef} className="max-h-96 overflow-auto rounded-xl border border-slate-100"><div className="overflow-x-auto"><table className="w-full text-left">
            <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase text-slate-500 shadow-sm"><tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Product status</th><th className="px-4 py-3 text-right">Units sent out</th><th className="px-4 py-3">Movement speed</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{movementRows.map((row) => <tr key={row.productId}>
              <td className="px-4 py-3 text-sm font-semibold text-slate-800">{row.name}<span className="block text-xs font-normal text-slate-500">Code: {row.sku}</span></td>
              <td className="px-4 py-3 text-sm capitalize">{row.category}</td>
              <td className="px-4 py-3 text-sm capitalize">{row.status}</td>
              <td className="px-4 py-3 text-right text-sm">{row.quantity} {row.unit}</td>
              <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${row.classification === 'fast_moving' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}`}>{row.classification.replaceAll('_', ' ')}</span></td>
            </tr>)}</tbody>
          </table></div>
          {movementPage?.hasMore && <div ref={movementSentinelRef} role="status" className="py-3 text-center text-xs text-slate-400">More products are available below.</div>}
          </div>}
          {movementPage && <p className="text-xs text-slate-500">Showing {movementRows.length} of {movementPage.totalCount} products for {formatAnalyticsDateRange(fromDate, toDate)}; stock movement uses its recorded UTC date, and fast-moving means {describeFastMovingCutoff(Number(movementThreshold))}.</p>}
          {movementPage?.hasMore && <div className="flex justify-center py-3"><button type="button" onClick={() => void loadMoreMovement()} disabled={movementLoadingMore} className="rounded-lg border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50">{movementLoadingMore ? 'Loading…' : movementLoadMoreError ? 'Retry loading products' : 'Load more products'}</button></div>}
          {movementLoadingMore && <p role="status" className="py-2 text-center text-xs text-slate-400">Loading more products…</p>}
          {movementLoadMoreError && <p role="alert" className="text-center text-sm text-rose-700">{movementLoadMoreError}</p>}
        </section>

        {/* Inventory and order snapshot */}
        <div className="bg-white rounded-[28px] shadow-sm border border-[#f1f5f9] p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Inventory and Order Snapshot</h3>
              <p className="text-xs text-slate-500">Current stock compared with orders that were not cancelled during the selected period</p>
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
          <div ref={snapshotScrollerRef} className="max-h-96 overflow-auto rounded-xl border border-slate-100">
            <div className="overflow-x-auto"><table className="w-full">
              <thead className="sticky top-0 z-10 border-b border-[#f1f5f9] bg-slate-50/95 shadow-sm">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                  <th title="On-hand stock compared with the minimum restock level." className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Stock / restock level</th>
                  <th title="Units ordered in the selected delivery-date range. This is not the amount currently in stock." className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Units ordered</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Stock status</th>
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
                    <td className="px-4 py-3 text-right text-sm text-slate-700">
                      <span title="Current on-hand stock / minimum restock level">{item.stock} / {item.threshold} {item.unit}</span>
                      <div className="ml-auto mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100" aria-label={`Stock level ${item.stock} of restock level ${item.threshold} ${item.unit}`}>
                        <div className={`h-full ${item.stock === 0 || item.stock < item.threshold ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${item.threshold > 0 ? Math.min(100, item.stock / item.threshold * 100) : item.stock > 0 ? 100 : 0}%` }} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-slate-700">{item.orderedQty} {item.unit}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${item.stock === 0 ? 'bg-rose-100 text-rose-700' : item.stock < item.threshold ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-700'}`}>
                        {item.stock === 0 ? 'Out of stock' : item.stock < item.threshold ? 'Low stock' : 'Adequate'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
            {snapshotPage?.hasMore && <div ref={snapshotSentinelRef} role="status" className="py-3 text-center text-xs text-slate-400">More products are available below.</div>}
          </div>
          {snapshotPage?.hasMore && <div className="flex justify-center py-3"><button type="button" onClick={() => void loadMoreSnapshot()} disabled={snapshotLoadingMore} className="rounded-lg border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50">{snapshotLoadingMore ? 'Loading…' : snapshotError ? 'Retry loading products' : 'Load more products'}</button></div>}
          {snapshotLoadingMore && <div role="status" className="py-3 text-center text-xs text-slate-400">Loading more products…</div>}
          {!snapshotLoading && !snapshotError && snapshotPage?.totalCount === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">No products are available.</p>
          )}
        </div>

        {/* Order-history demand estimates */}
        <div className="bg-gradient-to-r from-violet-50/70 to-indigo-50/70 rounded-[28px] border border-violet-100/80 p-6">
          <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center shadow-2xs">
                <Package className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Sales Estimate for Next Month</h3>
                <p className="text-xs text-slate-600">Based on completed orders from recent months. We need sales in at least three months to show an estimate.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <Clock className="w-3.5 h-3.5 text-violet-500" />
              <span>Based on past orders</span>
            </div>
          </div>
          
          <div className="mb-6 overflow-hidden rounded-2xl border border-violet-100/80 bg-white shadow-2xs">
            <div className="border-b border-violet-100 bg-violet-50/60 p-4 text-xs text-slate-600">
              Uses completed orders from recent months to estimate next month's sales. An estimate appears after sales are recorded in at least three different months.
            </div>
            {forecastLoading ? <p className="p-8 text-center text-sm text-slate-500">Preparing sales estimates…</p> : forecastError ? <div role="alert" className="p-8 text-center text-sm text-rose-700"><p>We could not load the sales estimate. Please try again.</p><button type="button" onClick={() => setForecastRefreshKey((current) => current + 1)} className="mt-3 font-semibold text-indigo-600 hover:text-indigo-800">Retry</button></div> : availableForecastRows.length === 0 ? <p className="p-6 text-center text-sm text-slate-600">No products have enough sales history for an estimate yet. We need recorded sales in at least three months.</p> : <div ref={forecastScrollerRef} className="max-h-96 overflow-auto"><div className="overflow-x-auto"><table className="w-full"><thead className="sticky top-0 z-10 bg-violet-50/95 shadow-sm"><tr><th className="px-4 py-3 text-left text-xs font-bold uppercase text-violet-700">Product</th><th title="Current stock compared with the minimum restock level." className="px-4 py-3 text-right text-xs font-bold uppercase text-violet-700">Stock / reorder point</th><th title="Based on recent completed orders; discrete-item estimates round up to whole pieces." className="px-4 py-3 text-right text-xs font-bold uppercase text-violet-700">Sales estimate</th><th title="Backend suggested restock quantity; whole pieces are shown for discrete units." className="px-4 py-3 text-right text-xs font-bold uppercase text-violet-700">Suggested restock</th><th title="Estimated days current stock may cover demand." className="px-4 py-3 text-right text-xs font-bold uppercase text-violet-700">Days of supply</th><th className="px-4 py-3 text-left text-xs font-bold uppercase text-violet-700">Stock status</th><th title="Number of recent months with recorded sales." className="px-4 py-3 text-right text-xs font-bold uppercase text-violet-700">Months with sales</th></tr></thead><tbody className="divide-y divide-slate-100">{availableForecastRows.map(item => { const stockRatio = item.reorderPoint > 0 ? Math.min(100, item.currentStock / item.reorderPoint * 100) : item.currentStock > 0 ? 100 : 0; const statusClass = item.policyAssessment === 'below_reorder_point' ? 'bg-rose-100 text-rose-700' : item.policyAssessment === 'below_forecast' ? 'bg-amber-100 text-amber-800' : item.policyAssessment === 'adequate' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'; return <tr key={item.productId}><td className="px-4 py-3"><p className="text-sm font-semibold text-slate-800">{item.name}</p><p className="text-xs text-slate-500">Code: {item.sku} · {item.category}</p></td><td className="px-4 py-3 text-right text-sm text-slate-700"><span title="On hand / minimum level">{item.currentStock} / {item.reorderPoint} {item.unit}</span><div className="ml-auto mt-2 h-1.5 w-28 overflow-hidden rounded-full bg-slate-100"><div className={`h-full ${item.currentStock < item.reorderPoint ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${stockRatio}%` }} /></div></td><td className="px-4 py-3 text-right text-sm font-semibold text-slate-700"><span>{formatPlanQuantity(item.forecastQuantity!, item.unit)}</span></td><td className="px-4 py-3 text-right text-sm font-bold text-violet-700">{item.recommendedOrderQuantity === null ? '—' : formatPlanQuantity(item.recommendedOrderQuantity, item.unit)}</td><td className="px-4 py-3 text-right text-sm text-slate-700">{item.stockCoverageDays === null ? '—' : `${item.stockCoverageDays} days`}</td><td className="px-4 py-3 text-sm text-slate-700"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusClass}`}>{formatStockCheck(item.policyAssessment)}</span></td><td className="px-4 py-3 text-right text-sm text-slate-500">{item.positiveMonths} months</td></tr>; })}</tbody></table></div>{forecastPage?.hasMore && <div ref={forecastSentinelRef} role="status" className="py-3 text-center text-xs text-slate-400">More estimate rows are available below.</div>}</div>}
          </div>
          {forecastPage && <p className="text-xs text-slate-500 mt-2">Showing {availableForecastRows.length} of {forecastPage.totalCount} products with sufficient history.</p>}
          {forecastPage?.hasMore && <div className="flex justify-center py-3"><button type="button" onClick={() => void loadMoreForecast()} disabled={forecastLoadingMore} className="rounded-lg border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50">{forecastLoadingMore ? 'Loading…' : forecastLoadMoreError ? 'Retry loading estimates' : 'Load more estimates'}</button></div>}
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
            <p className="text-xs text-slate-500 mb-3">Up to 3 backend-selected examples of active products below their restock levels.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {stockAlerts.slice(0, 3).map((rec) => (
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
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{simplifyInsightText(rec.description)}</p>
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