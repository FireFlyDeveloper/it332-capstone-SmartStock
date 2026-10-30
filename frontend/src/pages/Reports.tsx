import React, { useCallback, useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Filter,
  Banknote
} from 'lucide-react';

import type { Order } from '../types';
import { formatCurrency, formatDate, getStatusColor, formatDateInput } from '../utils/helpers';
import { toCSV, downloadCSV } from '../utils/csv';
import { toast } from 'sonner';
import { getProductsPage, apiFetchBlob, getAnalyticsPurchasesPage, getDemandForecastPage, getPolicyPerformancePage, getOrdersPage, getReportOrdersSummary, type ProductsPageResponse, type ApiError, type ReportOrdersSummary, type PurchaseAnalyticsPageResponse, type DemandForecastPageResponse, type DemandForecastProduct, type PolicyPerformancePageResponse } from '../api';
import { toFrontendOrder } from '../components/orderMapper';
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
  const navigate = useNavigate();
  const { canExportReports } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Order['orderStatus']>('all');
  const [datePreset, setDatePreset] = useState<DateRangePreset>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [exportType, setExportType] = useState<ExportType>('sales');
  const [generatedAt] = useState(() => new Date().toLocaleString());
  const [purchaseYear, setPurchaseYear] = useState(String(new Date().getFullYear()));
  const numericPurchaseYear = /^\d{4}$/.test(purchaseYear) ? Number(purchaseYear) : null;
  const purchaseYearIsValid = numericPurchaseYear !== null && numericPurchaseYear >= 2000 && numericPurchaseYear <= 2100;
  const [purchaseData, setPurchaseData] = useState<PurchaseAnalyticsPageResponse | null>(null);
  const [purchaseLoading, setPurchaseLoading] = useState(true);
  const [purchaseError, setPurchaseError] = useState('');
  const [purchaseLoadingMore, setPurchaseLoadingMore] = useState(false);
  const [purchaseLoadMoreError, setPurchaseLoadMoreError] = useState('');
  const purchaseSentinelRef = useRef<HTMLDivElement | null>(null);
  const purchaseRequestRef = useRef(0);
  const purchaseLoadingMoreRef = useRef(false);
  const [policyRows, setPolicyRows] = useState<DemandForecastProduct[]>([]);
  const [policyPage, setPolicyPage] = useState<DemandForecastPageResponse['page'] | null>(null);
  const [policyLoading, setPolicyLoading] = useState(true);
  const [policyError, setPolicyError] = useState('');
  const [policyLoadingMore, setPolicyLoadingMore] = useState(false);
  const [policyLoadMoreError, setPolicyLoadMoreError] = useState('');
  const policySentinelRef = useRef<HTMLDivElement | null>(null);
  const policyRequestRef = useRef(0);
  const policyLoadingMoreRef = useRef(false);
  const [observedPolicy, setObservedPolicy] = useState<PolicyPerformancePageResponse | null>(null);
  const [observedPolicyLoading, setObservedPolicyLoading] = useState(true);
  const [observedPolicyError, setObservedPolicyError] = useState('');
  const [observedPolicyLoadingMore, setObservedPolicyLoadingMore] = useState(false);
  const [observedPolicyLoadMoreError, setObservedPolicyLoadMoreError] = useState('');
  const observedPolicySentinelRef = useRef<HTMLDivElement | null>(null);
  const observedPolicyRequestRef = useRef(0);
  const observedPolicyLoadingMoreRef = useRef(false);
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [historyTotalCount, setHistoryTotalCount] = useState(0);
  const [historyHasMore, setHistoryHasMore] = useState(false);
  const [historyCursor, setHistoryCursor] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyLoadingMore, setHistoryLoadingMore] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [historyRetry, setHistoryRetry] = useState(0);
  const historySentinelRef = useRef<HTMLDivElement | null>(null);
  const historyRequestRef = useRef(0);
  const historyLoadingMoreRef = useRef(false);
  const [orderSummary, setOrderSummary] = useState<ReportOrdersSummary | null>(null);
  const [orderSummaryLoading, setOrderSummaryLoading] = useState(true);
  const [orderSummaryError, setOrderSummaryError] = useState('');
  const [inventorySummary, setInventorySummary] = useState<ProductsPageResponse['summary'] | null>(null);
  const [inventorySummaryLoading, setInventorySummaryLoading] = useState(true);
  const [inventorySummaryError, setInventorySummaryError] = useState('');
  const [inventorySummaryRetry, setInventorySummaryRetry] = useState(0);
  const inventorySummaryRequestRef = useRef(0);

  useEffect(() => {
    const requestId = ++inventorySummaryRequestRef.current;
    setInventorySummaryLoading(true);
    setInventorySummaryError('');
    getProductsPage({ limit: 1 })
      .then((response) => {
        if (requestId === inventorySummaryRequestRef.current) setInventorySummary(response.summary);
      })
      .catch((error: unknown) => {
        if (requestId === inventorySummaryRequestRef.current) {
          setInventorySummaryError(error instanceof Error ? error.message : 'Could not load inventory summary.');
        }
      })
      .finally(() => {
        if (requestId === inventorySummaryRequestRef.current) setInventorySummaryLoading(false);
      });
    return () => {
      if (requestId === inventorySummaryRequestRef.current) inventorySummaryRequestRef.current += 1;
    };
  }, [inventorySummaryRetry]);

  useEffect(() => {
    let active = true;
    setOrderSummaryLoading(true);
    setOrderSummaryError('');
    getReportOrdersSummary({ fromDate: fromDate || null, toDate: toDate || null })
      .then((summary) => { if (active) setOrderSummary(summary); })
      .catch((error) => {
        if (active) setOrderSummaryError(error instanceof Error ? error.message : 'Could not load order summary.');
      })
      .finally(() => { if (active) setOrderSummaryLoading(false); });
    return () => { active = false; };
  }, [fromDate, toDate, historyRetry]);

  useEffect(() => {
    const requestId = ++historyRequestRef.current;
    setHistoryOrders([]);
    setHistoryTotalCount(0);
    setHistoryHasMore(false);
    setHistoryCursor(null);
    historyLoadingMoreRef.current = false;
    setHistoryLoadingMore(false);
    setHistoryError('');
    setHistoryLoading(true);
    getOrdersPage({ limit: 25, status: statusFilter, search: searchTerm, fromDate: fromDate || null, toDate: toDate || null })
      .then((response) => {
        if (requestId !== historyRequestRef.current) return;
        setHistoryOrders(response.orders.map(toFrontendOrder));
        setHistoryTotalCount(response.page.totalCount);
        setHistoryHasMore(response.page.hasMore);
        setHistoryCursor(response.page.nextCursor);
      })
      .catch((error) => {
        if (requestId === historyRequestRef.current) setHistoryError(error instanceof Error ? error.message : 'Could not load order history.');
      })
      .finally(() => {
        if (requestId === historyRequestRef.current) setHistoryLoading(false);
      });
    return () => {
      if (requestId === historyRequestRef.current) historyRequestRef.current += 1;
    };
  }, [searchTerm, statusFilter, fromDate, toDate, historyRetry]);

  const loadMoreHistory = useCallback(async () => {
    if (!historyHasMore || !historyCursor || historyLoading || historyLoadingMoreRef.current) return;
    const requestId = historyRequestRef.current;
    historyLoadingMoreRef.current = true;
    setHistoryLoadingMore(true);
    setHistoryError('');
    try {
      const response = await getOrdersPage({
        limit: 25,
        cursor: historyCursor,
        status: statusFilter,
        search: searchTerm,
        fromDate: fromDate || null,
        toDate: toDate || null,
      });
      if (requestId !== historyRequestRef.current) return;
      setHistoryOrders((current) => [...current, ...response.orders.map(toFrontendOrder)]);
      setHistoryTotalCount(response.page.totalCount);
      setHistoryHasMore(response.page.hasMore);
      setHistoryCursor(response.page.nextCursor);
    } catch (error) {
      if (requestId === historyRequestRef.current) setHistoryError(error instanceof Error ? error.message : 'Could not load more order history.');
    } finally {
      if (requestId === historyRequestRef.current) {
        historyLoadingMoreRef.current = false;
        setHistoryLoadingMore(false);
      }
    }
  }, [historyHasMore, historyCursor, historyLoading, statusFilter, searchTerm, fromDate, toDate]);

  useEffect(() => {
    const sentinel = historySentinelRef.current;
    if (!sentinel || !historyHasMore || historyLoading || historyLoadingMore || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) void loadMoreHistory();
    }, { rootMargin: '320px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [historyHasMore, historyLoading, historyLoadingMore, loadMoreHistory]);

  useEffect(() => {
    const requestId = ++purchaseRequestRef.current;
    setPurchaseData(null);
    setPurchaseLoadMoreError('');
    purchaseLoadingMoreRef.current = false;
    setPurchaseLoadingMore(false);
    if (!purchaseYearIsValid || numericPurchaseYear === null) {
      setPurchaseLoading(false);
      setPurchaseError('Enter a year between 2000 and 2100.');
      return () => {
        if (requestId === purchaseRequestRef.current) purchaseRequestRef.current += 1;
      };
    }
    setPurchaseLoading(true);
    setPurchaseError('');
    getAnalyticsPurchasesPage({ year: numericPurchaseYear, limit: 25 }).then(data => {
      if (requestId === purchaseRequestRef.current) setPurchaseData(data);
    }).catch(error => {
      if (requestId === purchaseRequestRef.current) setPurchaseError(error instanceof Error ? error.message : 'Could not load annual spending.');
    }).finally(() => {
      if (requestId === purchaseRequestRef.current) setPurchaseLoading(false);
    });
    return () => {
      if (requestId === purchaseRequestRef.current) purchaseRequestRef.current += 1;
    };
  }, [purchaseYear, numericPurchaseYear, purchaseYearIsValid]);

  const loadMorePurchaseGroups = useCallback(async () => {
    if (!purchaseYearIsValid || numericPurchaseYear === null || !purchaseData?.page.hasMore || !purchaseData.page.nextCursor || purchaseLoading || purchaseLoadingMoreRef.current) return;
    const requestId = purchaseRequestRef.current;
    purchaseLoadingMoreRef.current = true;
    setPurchaseLoadingMore(true);
    setPurchaseLoadMoreError('');
    try {
      const response = await getAnalyticsPurchasesPage({ year: numericPurchaseYear, limit: 25, cursor: purchaseData.page.nextCursor });
      if (requestId !== purchaseRequestRef.current) return;
      setPurchaseData(current => current ? { ...current, groups: [...current.groups, ...response.groups], page: response.page } : response);
    } catch (error) {
      if (requestId === purchaseRequestRef.current) setPurchaseLoadMoreError(error instanceof Error ? error.message : 'Could not load more purchase groups.');
    } finally {
      if (requestId === purchaseRequestRef.current) {
        purchaseLoadingMoreRef.current = false;
        setPurchaseLoadingMore(false);
      }
    }
  }, [purchaseData, purchaseLoading, numericPurchaseYear, purchaseYearIsValid]);

  useEffect(() => {
    const sentinel = purchaseSentinelRef.current;
    if (!sentinel || !purchaseData?.page.hasMore || purchaseLoading || purchaseLoadingMore || purchaseLoadMoreError || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) void loadMorePurchaseGroups();
    }, { rootMargin: '320px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [purchaseData?.page.hasMore, purchaseLoading, purchaseLoadingMore, purchaseLoadMoreError, loadMorePurchaseGroups]);
  useEffect(() => {
    const requestId = ++policyRequestRef.current;
    setPolicyRows([]);
    setPolicyPage(null);
    setPolicyLoading(true);
    setPolicyError('');
    setPolicyLoadMoreError('');
    policyLoadingMoreRef.current = false;
    setPolicyLoadingMore(false);
    getDemandForecastPage({ historyMonths: 12, limit: 25 })
      .then((data) => {
        if (requestId !== policyRequestRef.current) return;
        setPolicyRows(data.products);
        setPolicyPage(data.page);
      })
      .catch((error) => {
        if (requestId === policyRequestRef.current) setPolicyError(error instanceof Error ? error.message : 'Could not load current stock-policy assessment.');
      })
      .finally(() => {
        if (requestId === policyRequestRef.current) setPolicyLoading(false);
      });
    return () => {
      if (requestId === policyRequestRef.current) policyRequestRef.current += 1;
    };
  }, []);

  const loadMorePolicyRows = useCallback(async () => {
    if (!policyPage?.hasMore || !policyPage.nextCursor || policyLoading || policyLoadingMoreRef.current) return;
    const requestId = policyRequestRef.current;
    policyLoadingMoreRef.current = true;
    setPolicyLoadingMore(true);
    setPolicyLoadMoreError('');
    try {
      const response = await getDemandForecastPage({ historyMonths: 12, limit: 25, cursor: policyPage.nextCursor });
      if (requestId !== policyRequestRef.current) return;
      setPolicyRows((current) => [...current, ...response.products]);
      setPolicyPage(response.page);
    } catch (error) {
      if (requestId === policyRequestRef.current) setPolicyLoadMoreError(error instanceof Error ? error.message : 'Could not load more policy rows.');
    } finally {
      if (requestId === policyRequestRef.current) {
        policyLoadingMoreRef.current = false;
        setPolicyLoadingMore(false);
      }
    }
  }, [policyPage, policyLoading]);

  useEffect(() => {
    const sentinel = policySentinelRef.current;
    if (!sentinel || !policyPage?.hasMore || policyLoading || policyLoadingMore || policyLoadMoreError || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) void loadMorePolicyRows();
    }, { rootMargin: '320px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [policyPage?.hasMore, policyLoading, policyLoadingMore, policyLoadMoreError, loadMorePolicyRows]);
  useEffect(() => {
    const requestId = ++observedPolicyRequestRef.current;
    setObservedPolicy(null);
    setObservedPolicyLoading(true);
    setObservedPolicyError('');
    setObservedPolicyLoadMoreError('');
    observedPolicyLoadingMoreRef.current = false;
    setObservedPolicyLoadingMore(false);
    getPolicyPerformancePage({ limit: 25 }).then(data => {
      if (requestId === observedPolicyRequestRef.current) setObservedPolicy(data);
    }).catch(error => {
      if (requestId === observedPolicyRequestRef.current) setObservedPolicyError(error instanceof Error ? error.message : 'Could not load observed stock-policy performance.');
    }).finally(() => {
      if (requestId === observedPolicyRequestRef.current) setObservedPolicyLoading(false);
    });
    return () => {
      if (requestId === observedPolicyRequestRef.current) observedPolicyRequestRef.current += 1;
    };
  }, []);

  const loadMoreObservedPolicy = useCallback(async () => {
    if (!observedPolicy?.page.hasMore || !observedPolicy.page.nextCursor || observedPolicyLoading || observedPolicyLoadingMoreRef.current) return;
    const requestId = observedPolicyRequestRef.current;
    observedPolicyLoadingMoreRef.current = true;
    setObservedPolicyLoadingMore(true);
    setObservedPolicyLoadMoreError('');
    try {
      const response = await getPolicyPerformancePage({ limit: 25, cursor: observedPolicy.page.nextCursor });
      if (requestId !== observedPolicyRequestRef.current) return;
      setObservedPolicy(current => current ? { ...current, rows: [...current.rows, ...response.rows], page: response.page } : response);
    } catch (error) {
      if (requestId === observedPolicyRequestRef.current) setObservedPolicyLoadMoreError(error instanceof Error ? error.message : 'Could not load more observed policy rows.');
    } finally {
      if (requestId === observedPolicyRequestRef.current) {
        observedPolicyLoadingMoreRef.current = false;
        setObservedPolicyLoadingMore(false);
      }
    }
  }, [observedPolicy, observedPolicyLoading]);

  useEffect(() => {
    const sentinel = observedPolicySentinelRef.current;
    if (!sentinel || !observedPolicy?.page.hasMore || observedPolicyLoading || observedPolicyLoadingMore || observedPolicyLoadMoreError || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) void loadMoreObservedPolicy();
    }, { rootMargin: '320px' });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [observedPolicy?.page.hasMore, observedPolicyLoading, observedPolicyLoadingMore, observedPolicyLoadMoreError, loadMoreObservedPolicy]);

  const dateRangeAnchor = new Date();

  const handleDatePreset = (preset: '7d' | '30d' | 'all') => {
    setDatePreset(preset);
    if (preset === 'all') {
      setFromDate('');
      setToDate('');
      toast.info('Showing all-time records.');
    } else {
      const end = new Date(dateRangeAnchor);
      const start = new Date(dateRangeAnchor);
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

  // The backend order-history endpoint applies filters before cursor pagination.
  const transactionHistory = useMemo(() => {
    return historyOrders.map((order) => ({
      id: order.id,
      type: 'order' as const,
      reference: order.referenceNumber,
      items: order.items.map(item => ({ name: item.productName, quantity: item.quantity, amount: item.total })),
      total: order.total,
      date: order.date,
      status: order.orderStatus,
    }));
  }, [historyOrders]);
  const filteredTransactions = transactionHistory;
  const availablePolicyRows = policyRows;

  // Summary counts and totals are computed from the backend's full filtered dataset.
  const totalSales = orderSummary?.totalSales ?? 0;
  const totalRevenue = totalSales;
  const totalOrders = orderSummary?.totalOrders ?? 0;
  const completedOrders = orderSummary?.completedCount ?? 0;
  const pendingOrders = orderSummary?.pendingOrders ?? 0;
  const statusCounts = orderSummary?.statusCounts ?? { completed: 0, inProgress: 0, pending: 0, cancelled: 0 };
  const paymentCounts = orderSummary?.paymentCounts ?? { paid: 0, pending: 0, partial: 0, refunded: 0 };
  const totalProducts = inventorySummary?.totalProducts ?? 0;
  const totalInventoryValue = inventorySummary?.totalInventoryValue ?? 0;

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

  const handleForecastExport = async (format: 'pdf' | 'xlsx') => {
    try {
      const response = await apiFetchBlob(`/reports/export?type=forecast&format=${format}`);
      const blob = await response.blob();
      const filename = response.headers.get('content-disposition')?.match(/filename="?([^";]+)"?/)?.[1] ?? `smartstock-forecast-report.${format}`;
      const url = URL.createObjectURL(blob); const link = document.createElement('a');
      link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
      toast.success(`Forecast report (${format.toUpperCase()}) downloaded.`);
    } catch (error) { const err = error as ApiError; toast.error(err.message || 'Could not download forecast report.'); }
  };

  const handlePolicyPerformanceExport = async (format: 'pdf' | 'xlsx') => {
    try {
      const response = await apiFetchBlob(`/reports/export?type=policy-performance&format=${format}`);
      const filename = response.headers.get('content-disposition')?.match(/filename="?([^";]+)"?/)?.[1] ?? `smartstock-policy-performance-report.${format}`;
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
      toast.success(`Observed policy-performance report (${format.toUpperCase()}) downloaded.`);
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.status === 403 ? 'Only admins can export PDF/XLSX reports.' : apiError.message || 'Could not download policy-performance report.');
    }
  };

  const handleExportCSV = async () => {
    try {
      const allOrders: Order[] = [];
      let cursor: string | null = null;
      let hasMore = true;
      while (hasMore) {
        const response = await getOrdersPage({
          limit: 100,
          cursor,
          status: statusFilter,
          search: searchTerm,
          fromDate: fromDate || null,
          toDate: toDate || null,
        });
        allOrders.push(...response.orders.map(toFrontendOrder));
        hasMore = response.page.hasMore;
        cursor = response.page.nextCursor;
        if (hasMore && !cursor) throw new Error('Order history returned no cursor for another page.');
      }
      if (allOrders.length === 0) {
        toast.warning('No orders found for the selected filters.');
        return;
      }
      const rows = allOrders.map((order) => ({
        id: order.id,
        type: 'order' as const,
        reference: order.referenceNumber,
        items: order.items.map((item) => `${item.productName} (qty: ${item.quantity})`).join('; '),
        total: order.total,
        date: order.date,
        status: order.orderStatus,
      }));
      const columns: { key: keyof typeof rows[0]; header: string }[] = [
        { key: 'id', header: 'Order ID' },
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
      toast.success(`Exported ${allOrders.length} order records to CSV.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not export order history.');
    }
  };

  const getTransactionIcon = (type: 'order' | 'restock' | 'return' | 'adjustment') => {
    switch (type) {
      case 'order': return ShoppingCart;
      case 'restock': return Package;
      case 'return': return RotateCcw;
      case 'adjustment': return Settings;
      default: return DollarSign;
    }
  };

  const getTransactionColor = (type: 'order' | 'restock' | 'return' | 'adjustment') => {
    switch (type) {
      case 'order': return 'bg-emerald-50 text-[#10b981]';
      case 'restock': return 'bg-indigo-50 text-[#4f46e5]';
      case 'return': return 'bg-rose-50 text-[#f43f5e]';
      case 'adjustment': return 'bg-amber-50 text-[#f59e0b]';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  if (inventorySummaryLoading || orderSummaryLoading) {
    return <div role="status" className="rounded-3xl bg-white p-8 text-center text-slate-600">Loading report source data from backend…</div>;
  }
  const sourceError = [inventorySummaryError && `Inventory summary: ${inventorySummaryError}`, orderSummaryError && `Order summary: ${orderSummaryError}`].filter(Boolean).join('; ');
  if (sourceError) {
    return (
      <div role="alert" className="rounded-3xl border border-rose-200 bg-white p-8 text-center">
        <p className="font-semibold text-rose-700">Could not load report source data: {sourceError}</p>
        <button
          type="button"
          onClick={() => {
            setHistoryRetry((current) => current + 1);
            setInventorySummaryRetry((current) => current + 1);
          }}
          className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
      <div className="space-y-6 animate-fadeIn">
        {/* Header — title + generated-at + Daily Cash button */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-[-0.02em]">
              Financial Reports &amp; Statement
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Generated on: <span className="font-mono text-slate-700">{generatedAt}</span>
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
              <select
                aria-label="Report date range"
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
                  <option value="pending">Pending</option>
                  <option value="ready_for_pickup">Ready for Pickup</option>
                  <option value="packed">Packed</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="completed">Completed</option>
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

        <section className="space-y-4 rounded-[28px] border border-[#f1f5f9] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-extrabold text-slate-900">Annual procurement spending</h2><p className="text-xs text-slate-500">Recorded receipt acquisition costs only. Unknown costs are excluded, never estimated from selling prices.</p></div><label className="text-xs font-semibold text-slate-600">Year <input className="input ml-2 w-28" type="number" min="2000" max="2100" value={purchaseYear} onChange={e => setPurchaseYear(e.target.value)}/></label></div>
          {purchaseLoading ? <p className="py-6 text-sm text-slate-500">Loading purchase costs…</p> : purchaseError ? <p role="alert" className="py-6 text-sm text-rose-700">{purchaseError}</p> : purchaseData ? <><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl bg-slate-50 p-4"><p className="text-xs uppercase text-slate-500">Priced spend · {purchaseYear}</p><p className="mt-1 text-xl font-black text-slate-900">{formatCurrency(purchaseData.totalSpend)}</p></div><div className="rounded-2xl bg-amber-50 p-4"><p className="text-xs uppercase text-amber-700">Unpriced receipts</p><p className="mt-1 text-xl font-black text-amber-900">{purchaseData.unpricedReceiptCount}</p></div><div className="rounded-2xl bg-amber-50 p-4"><p className="text-xs uppercase text-amber-700">Unpriced quantity</p><p className="mt-1 text-xl font-black text-amber-900">{purchaseData.unpricedQuantity}</p></div></div><div className="mt-4 overflow-x-auto"><table className="w-full text-left"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Material</th><th className="px-4 py-3">Supplier</th><th className="px-4 py-3 text-right">Priced receipts</th><th className="px-4 py-3 text-right">Quantity</th><th className="px-4 py-3 text-right">Recorded spend</th><th className="px-4 py-3 text-right">Unpriced qty</th></tr></thead><tbody className="divide-y divide-slate-100">{purchaseData.groups.map(row=><tr key={`${row.materialType}-${row.supplier}`}><td className="px-4 py-3 text-sm capitalize">{row.materialType}</td><td className="px-4 py-3 text-sm">{row.supplier || '—'}</td><td className="px-4 py-3 text-right text-sm">{Math.max(0, row.transactionCount - row.unpricedReceiptCount)}</td><td className="px-4 py-3 text-right text-sm">{row.totalQuantity}</td><td className="px-4 py-3 text-right text-sm font-semibold">{formatCurrency(row.totalCost)}</td><td className="px-4 py-3 text-right text-sm">{row.unpricedQuantity ?? 0}</td></tr>)}{purchaseData.groups.length===0&&<tr><td colSpan={6} className="p-6 text-center text-sm text-slate-500">No purchase receipts recorded for this year.</td></tr>}</tbody></table></div></> : null}
        </section>
        {purchaseData && <p className="px-1 text-xs text-slate-500">Showing {purchaseData.groups.length} of {purchaseData.page.totalCount} purchase groups.</p>}
        {purchaseData?.page.hasMore && <div ref={purchaseSentinelRef} role="status" className="py-3 text-center text-xs text-slate-400">Scroll to load more purchase groups…</div>}
        {purchaseLoadingMore && <p role="status" className="py-2 text-center text-xs text-slate-400">Loading more purchase groups…</p>}
        {purchaseLoadMoreError && <div role="alert" className="text-center text-sm text-rose-700"><p>{purchaseLoadMoreError}</p><button type="button" onClick={() => void loadMorePurchaseGroups()} className="mt-2 font-semibold text-indigo-600">Retry</button></div>}
        {purchaseData?.page.hasMore && typeof IntersectionObserver === 'undefined' && <div className="py-3 text-center"><button type="button" onClick={() => void loadMorePurchaseGroups()} disabled={purchaseLoadingMore} className="text-sm font-semibold text-indigo-600 disabled:opacity-50">{purchaseLoadingMore ? 'Loading…' : 'Load more purchase groups'}</button></div>}

        <section hidden={!policyLoading && !policyError && availablePolicyRows.length === 0} className="space-y-4 rounded-[28px] border border-violet-100 bg-violet-50/30 p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-extrabold text-slate-900">Current stock-policy assessment</h2><p className="max-w-3xl text-xs text-slate-600">This is a current assessment comparing present stock with the configured reorder threshold and next-month forecast. It does not measure historical policy decisions or causal effects.</p></div><div className="flex gap-2"><button onClick={() => void handleForecastExport('pdf')} className="btn-secondary text-xs">Download PDF</button><button onClick={() => void handleForecastExport('xlsx')} className="btn-secondary text-xs">Download XLSX</button></div></div>
          <p className="text-xs text-slate-500">Method: simple exponential smoothing (α=0.3), up to 12 complete UTC months of delivered-order sales, one-month horizon. A forecast requires at least three positive-quantity months; sparse histories remain unavailable.</p>
          {policyPage && <p className="text-xs text-slate-500">Showing {availablePolicyRows.length} of {policyPage.totalCount} products with sufficient history.</p>}
          {policyLoading ? <p className="py-6 text-sm text-slate-500">Loading current policy assessment…</p> : policyError ? <p role="alert" className="py-6 text-sm text-rose-700">{policyError}</p> : availablePolicyRows.length === 0 ? null : <div className="overflow-x-auto"><table className="w-full text-left"><thead className="bg-white text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Product</th><th className="px-4 py-3 text-right">Stock / threshold</th><th className="px-4 py-3 text-right">Next-month forecast</th><th className="px-4 py-3 text-right">Recommended order</th><th className="px-4 py-3">Assessment</th><th className="px-4 py-3">History</th></tr></thead><tbody className="divide-y divide-violet-100">{availablePolicyRows.map(row=><tr key={row.productId}><td className="px-4 py-3 text-sm font-semibold">{row.name}<span className="block text-xs font-normal text-slate-500">{row.sku}</span></td><td className="px-4 py-3 text-right text-sm">{row.currentStock} / {row.reorderPoint} {row.unit}</td><td className="px-4 py-3 text-right text-sm">{row.forecastQuantity} {row.unit}</td><td className="px-4 py-3 text-right text-sm">{row.recommendedOrderQuantity===null?'—':`${row.recommendedOrderQuantity} ${row.unit}`}</td><td className="px-4 py-3 text-sm capitalize">{row.policyAssessment.replaceAll('_',' ')}</td><td className="px-4 py-3 text-sm">{row.positiveMonths} positive months</td></tr>)}</tbody></table></div>}
          {policyLoadingMore && <p role="status" className="py-2 text-center text-xs text-slate-400">Loading more policy rows…</p>}
          {policyLoadMoreError && <div role="alert" className="text-center text-sm text-rose-700"><p>{policyLoadMoreError}</p><button type="button" onClick={() => void loadMorePolicyRows()} className="mt-2 font-semibold text-indigo-600">Retry</button></div>}
        </section>
        {policyPage?.hasMore && <div ref={policySentinelRef} role="status" className="py-3 text-center text-xs text-slate-400">Scroll to load more policy rows…</div>}
        {policyPage?.hasMore && typeof IntersectionObserver === 'undefined' && (
          <div className="py-3 text-center">
            <button type="button" onClick={() => void loadMorePolicyRows()} disabled={policyLoadingMore} className="text-sm font-semibold text-indigo-600 disabled:opacity-50">
              {policyLoadingMore ? 'Loading…' : 'Load more policy rows'}
            </button>
          </div>
        )}

        <section className="space-y-4 rounded-[28px] border border-emerald-100 bg-emerald-50/30 p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Observed stock &amp; reorder-policy performance</h2>
              <p className="mt-1 max-w-3xl text-xs text-slate-600">This is observed stock history, not a forecast or a causal evaluation. Tracking starts at the baseline after rollout; no pre-baseline history is included.</p>
            </div>
            {canExportReports ? (
              <div className="flex gap-2">
                <button type="button" onClick={() => void handlePolicyPerformanceExport('pdf')} className="btn-secondary text-xs">Download PDF</button>
                <button type="button" onClick={() => void handlePolicyPerformanceExport('xlsx')} className="btn-secondary text-xs">Download XLSX</button>
              </div>
            ) : <span className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500">Exports are admin-only</span>}
          </div>
          {observedPolicyLoading ? <p className="py-6 text-sm text-slate-500">Loading observed stock-policy performance…</p>
            : observedPolicyError ? <p role="alert" className="py-6 text-sm text-rose-700">{observedPolicyError}</p>
              : !observedPolicy || observedPolicy.rows.length === 0 ? <p className="py-6 text-sm text-slate-500">No observed policy-performance data is available yet.</p>
                : <>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
                    <span>Tracking since <strong className="text-slate-700">{observedPolicy.trackingStart ? formatDate(observedPolicy.trackingStart) : 'Not started'}</strong></span>
                    <span><strong className="text-slate-700">{observedPolicy.totals.trackingDays}</strong> tracking days</span>
                    <span>Report generated <strong className="text-slate-700">{formatDate(observedPolicy.generatedAt)}</strong></span>
                  </div>
                  {Object.keys(observedPolicy.totals).length > 0 && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {Object.entries(observedPolicy.totals).map(([key, value]) => <div key={key} className="rounded-2xl bg-white p-4">
                      <p className="text-xs uppercase text-slate-500">{key.replaceAll(/([A-Z])/g, ' $1').replaceAll('_', ' ')}</p>
                      <p className="mt-1 text-xl font-black text-slate-900">{Number.isInteger(value) ? value : value.toFixed(2)}</p>
                    </div>)}
                  </div>}
                  <div className="rounded-2xl border border-emerald-100 bg-white/80 p-4 text-xs text-slate-600">
                    <p><strong>Method:</strong> {observedPolicy.method}</p>
                    <p className="mt-1">{observedPolicy.assumption}</p>
                    <p className="mt-2">This report describes measured stock exposure only. It does not estimate missed demand, lead-time effects, holding costs, or causal effects of reorder policies.</p>
                  </div>
                  <p className="text-xs text-slate-500">Showing {observedPolicy.rows.length} of {observedPolicy.page.totalCount} products.</p>
                  <div className="overflow-x-auto"><table className="w-full text-left">
                    <thead className="bg-white text-xs uppercase text-slate-500"><tr>
                      <th className="px-4 py-3">Product</th><th className="px-4 py-3 text-right">Stock / threshold</th><th className="px-4 py-3 text-right">Avg. on hand</th>
                      <th className="px-4 py-3 text-right">Days ≤ threshold</th><th className="px-4 py-3 text-right">Time ≤ threshold</th><th className="px-4 py-3 text-right">Out-of-stock days</th>
                      <th className="px-4 py-3 text-right">Threshold changes</th><th className="px-4 py-3">Tracking</th>
                    </tr></thead>
                    <tbody className="divide-y divide-emerald-100">{observedPolicy.rows.map(row => <tr key={row.productId}>
                      <td className="px-4 py-3 text-sm font-semibold">{row.name}<span className="block text-xs font-normal text-slate-500">{row.sku}</span></td>
                      <td className="px-4 py-3 text-right text-sm">{row.currentStock} / {row.currentReorderPoint} {row.unit}</td>
                      <td className="px-4 py-3 text-right text-sm">{row.timeWeightedAverageOnHand === null ? '—' : `${row.timeWeightedAverageOnHand.toFixed(2)} ${row.unit}`}</td>
                      <td className="px-4 py-3 text-right text-sm">{row.trackingStartedAt === null ? '—' : row.daysAtOrBelowReorderPoint.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-sm">{row.percentTimeAtOrBelowReorderPoint === null ? '—' : `${row.percentTimeAtOrBelowReorderPoint.toFixed(1)}%`}</td>
                      <td className="px-4 py-3 text-right text-sm">{row.trackingStartedAt === null ? '—' : row.outOfStockDays.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-sm">{row.reorderPointChanges}</td>
                      <td className="px-4 py-3 text-sm">{row.trackingStartedAt ? `${row.trackingDays.toFixed(2)} days` : 'awaiting baseline'}</td>
                    </tr>)}</tbody>
                  </table></div>
                  {observedPolicy.page.hasMore && <div ref={observedPolicySentinelRef} role="status" className="py-3 text-center text-xs text-slate-400">Scroll to load more observed policy rows…</div>}
                  {observedPolicyLoadingMore && <p role="status" className="py-2 text-center text-xs text-slate-400">Loading more observed policy rows…</p>}
                  {observedPolicyLoadMoreError && <div role="alert" className="text-center text-sm text-rose-700"><p>{observedPolicyLoadMoreError}</p><button type="button" onClick={() => void loadMoreObservedPolicy()} className="mt-2 font-semibold text-indigo-600">Retry</button></div>}
                  {observedPolicy.page.hasMore && typeof IntersectionObserver === 'undefined' && <div className="py-3 text-center"><button type="button" onClick={() => void loadMoreObservedPolicy()} disabled={observedPolicyLoadingMore} className="text-sm font-semibold text-indigo-600 disabled:opacity-50">{observedPolicyLoadingMore ? 'Loading…' : 'Load more policy rows'}</button></div>}
                </>}
        </section>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Status Breakdown */}
          <div className="bg-white rounded-[28px] shadow-sm border border-[#f1f5f9] p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Order Status Breakdown</h3>
            <div className="space-y-4">
              {[
                { status: 'Completed', count: statusCounts.completed, color: 'bg-emerald-500' },
                { status: 'In Progress', count: statusCounts.inProgress, color: 'bg-sky-500' },
                { status: 'Pending', count: statusCounts.pending, color: 'bg-amber-500' },
                { status: 'Cancelled', count: statusCounts.cancelled, color: 'bg-rose-500' },
              ].map((item) => (
                <div key={item.status} className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-slate-600">{item.status}</span>
                    <span className="font-bold text-slate-900">{item.count} orders</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-2 rounded-full ${item.color} transition-all duration-500`} 
                      style={{ width: `${totalOrders > 0 ? (item.count / totalOrders) * 100 : 0}%` }}
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
                { status: 'Paid', count: paymentCounts.paid, color: 'bg-emerald-500' },
                { status: 'Pending', count: paymentCounts.pending, color: 'bg-amber-500' },
                { status: 'Partial', count: paymentCounts.partial, color: 'bg-orange-500' },
                { status: 'Refunded', count: paymentCounts.refunded, color: 'bg-rose-500' },
              ].map((item) => (
                <div key={item.status} className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-slate-600">{item.status}</span>
                    <span className="font-bold text-slate-900">{item.count} orders</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-2 rounded-full ${item.color} transition-all duration-500`} 
                      style={{ width: `${totalOrders > 0 ? (item.count / totalOrders) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Backend Order History */}
        <div className="bg-white rounded-[28px] shadow-sm border border-[#f1f5f9] overflow-hidden">
          <div className="p-6 border-b border-[#f1f5f9]">
            <h3 className="text-lg font-bold text-slate-900">Order History</h3>
            <p className="text-xs text-slate-500 mt-0.5">Orders returned by the backend for the selected period</p>
            {!historyLoading && <p className="text-xs text-slate-400 mt-1">Showing {historyOrders.length} of {historyTotalCount} matching orders</p>}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50/80 border-b border-[#f1f5f9]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Order ID</th>
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
          
          {historyLoading && <div role="status" className="p-8 text-center text-sm text-slate-500">Loading matching orders…</div>}
          {historyError && (
            <div role="alert" className="p-5 text-center text-sm text-rose-700">
              <p>{historyError}</p>
              <button type="button" onClick={() => historyOrders.length ? void loadMoreHistory() : setHistoryRetry((value) => value + 1)} className="mt-2 font-bold underline">
                Retry
              </button>
            </div>
          )}
          {historyHasMore && <div ref={historySentinelRef} role="status" className="py-3 text-center text-xs text-slate-400">Scroll to load more orders…</div>}
          {historyHasMore && typeof IntersectionObserver === 'undefined' && (
            <div className="py-3 text-center">
              <button type="button" onClick={() => void loadMoreHistory()} disabled={historyLoadingMore} className="text-sm font-semibold text-indigo-600 disabled:opacity-50">
                {historyLoadingMore ? 'Loading…' : 'Load more orders'}
              </button>
            </div>
          )}
          {historyLoadingMore && <div role="status" className="py-3 text-center text-xs text-slate-400">Loading more orders…</div>}
          {!historyLoading && !historyError && historyTotalCount === 0 && (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium text-sm">No orders found</p>
            </div>
          )}
        </div>


      </div>
  );
};

export default Reports;
