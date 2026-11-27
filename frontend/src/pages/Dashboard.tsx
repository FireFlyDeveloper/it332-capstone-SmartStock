import React, { useEffect, useRef, useState } from 'react';
import {
  ShoppingBag,
  Truck,
  AlertTriangle,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { useData } from '../components/DataContext';
import { useAuth } from '../components/AuthContext';
import {
  getDashboardOrderSummary,
  getDashboardRecentActivity,
  getProductsPage,
  type ProductsPageResponse,
  type DashboardActivityRecord,
  type DashboardOrderSummary,
} from '../api';


import { RecentActivityTimeline } from '../components/RecentActivityTimeline';
import { QuickActionsGrid } from '../components/QuickActionsGrid';
import { Link } from 'react-router-dom';

interface KpiCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ElementType;
  iconBoxBg: string;
  iconColor: string;
}

/**
 * Operational KPI card
 * - White surface with restrained corner radius and border
 * - Icon in a compact colored box
 * - Label and value stay readable without clipping
 * - Shows backend-derived current workload values without implying trends.
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

export const Dashboard: React.FC = () => {
  const { deliverySummary, deliveriesLoading, deliveriesError, refreshDeliveries } = useData();
  const { user } = useAuth();

  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);
  const [inventorySummary, setInventorySummary] = useState<ProductsPageResponse['summary'] | null>(null);
  const [inventorySummaryLoading, setInventorySummaryLoading] = useState(true);
  const [inventorySummaryError, setInventorySummaryError] = useState('');
  const [inventorySummaryRetry, setInventorySummaryRetry] = useState(0);
  const inventorySummaryRequestRef = useRef(0);

  const [orderSummary, setOrderSummary] = useState<DashboardOrderSummary | null>(null);
  const [orderSummaryLoading, setOrderSummaryLoading] = useState(true);
  const [orderSummaryError, setOrderSummaryError] = useState<string | null>(null);
  const [recentActivity, setRecentActivity] = useState<DashboardActivityRecord[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState<string | null>(null);

  useEffect(() => {
    const requestId = ++inventorySummaryRequestRef.current;
    setInventorySummaryLoading(true);
    setInventorySummaryError('');
    getProductsPage({ limit: 1 })
      .then((result) => {
        if (requestId === inventorySummaryRequestRef.current) setInventorySummary(result.summary);
      })
      .catch((cause: unknown) => {
        if (requestId === inventorySummaryRequestRef.current) setInventorySummaryError(cause instanceof Error ? cause.message : 'Could not load inventory summary.');
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
    setOrderSummaryError(null);
    getDashboardOrderSummary()
      .then((summary) => { if (active) setOrderSummary(summary); })
      .catch((cause: unknown) => {
        if (active) setOrderSummaryError(cause instanceof Error ? cause.message : 'Request failed');
      })
      .finally(() => { if (active) setOrderSummaryLoading(false); });
    return () => { active = false; };
  }, [dashboardRefreshKey]);

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

  const lowStockItems = inventorySummary?.activeLowStockCount ?? 0;
  const activeOrders = orderSummary?.activeOrderCount ?? 0;
  const inTransitDeliveries = deliverySummary.inTransitCount;


  const orderStatusCounts = orderSummary?.orderStatusCounts ?? [];

  const retryDashboard = () => {
    setDashboardRefreshKey((current) => current + 1);
    setInventorySummaryRetry((current) => current + 1);
    void refreshDeliveries().catch(() => undefined);
  };

  if (deliveriesLoading || inventorySummaryLoading) {
    return <div role="status" className="rounded-3xl bg-white p-8 text-center text-slate-600">Loading your dashboard…</div>;
  }
  const sourceError = [deliveriesError && `Deliveries: ${deliveriesError}`, inventorySummaryError && `Inventory: ${inventorySummaryError}`].filter(Boolean).join('; ');
  if (sourceError) {
    return (
      <div role="alert" className="rounded-3xl border border-rose-200 bg-white p-8 text-center">
        <p className="font-semibold text-rose-700">Could not load dashboard data: {sourceError}</p>
        <button type="button" onClick={retryDashboard} className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Retry</button>
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
            A quick look at current stock, orders, and deliveries.
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
            title="Refresh dashboard"
            className="p-2 rounded-2xl bg-white border border-[#f1f5f9] text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 shadow-2xs transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── 2. Operational KPI Row ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Active order count is an operational workload signal. */}
        <KpiCard
          label="ACTIVE ORDERS"
          value={orderSummaryLoading ? 'Loading…' : orderSummaryError ? 'Unavailable' : activeOrders}
          unit={orderSummaryLoading || orderSummaryError ? undefined : 'orders'}
          icon={ShoppingBag}
          iconBoxBg="bg-blue-50"
          iconColor="text-[#3b82f6]"
        />

        {/* In-transit deliveries are an operational workload signal. */}
        <KpiCard
          label="IN TRANSIT"
          value={inTransitDeliveries}
          unit="deliveries"
          icon={Truck}
          iconBoxBg="bg-amber-50"
          iconColor="text-[#f59e0b]"
        />

        {/* Low stock is an actionable inventory signal. */}
        <KpiCard
          label="LOW STOCK"
          value={lowStockItems}
          unit="products"
          icon={AlertTriangle}
          iconBoxBg="bg-rose-50"
          iconColor="text-[#f43f5e]"
        />
      </div>

      {user?.role === 'admin' && (
        <section className="flex flex-col gap-4 rounded-3xl border border-[#dce8df] bg-[#eaf2ec] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6" aria-labelledby="analytics-destination-title">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-800">Detailed analysis</p>
            <h2 id="analytics-destination-title" className="mt-1 text-lg font-extrabold text-slate-900">Trends and comparisons live in Analytics</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">Open the dedicated workspace for date-filtered sales, product movement, purchases, and stock history.</p>
          </div>
          <Link to="/analytics" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-[#26745b] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#1d5f49]">
            Open Analytics <span aria-hidden="true" className="ml-2">→</span>
          </Link>
        </section>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <RecentActivityTimeline
            activities={recentActivity}
            loading={activityLoading}
            error={activityError}
            onRetry={() => setDashboardRefreshKey((current) => current + 1)}
          />
        </div>
        <section className="rounded-3xl border border-[#e5ece7] bg-white p-5 shadow-sm sm:p-6 xl:col-span-5" aria-labelledby="dashboard-order-status-title">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Current snapshot</p>
              <h2 id="dashboard-order-status-title" className="mt-1 text-lg font-extrabold text-slate-900">Order status</h2>
            </div>
            <ShoppingBag className="h-5 w-5 text-emerald-700" aria-hidden="true" />
          </div>
          {orderSummaryLoading ? (
            <p role="status" className="mt-6 text-sm text-slate-500">Loading current order counts…</p>
          ) : orderSummaryError ? (
            <p role="alert" className="mt-6 text-sm text-rose-700">Order counts unavailable: {orderSummaryError}</p>
          ) : orderStatusCounts.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">No order records.</p>
          ) : (
            <ul className="mt-5 divide-y divide-slate-100">
              {orderStatusCounts.map(({ status, count }) => (
                <li key={status} className="flex items-center justify-between py-3 text-sm">
                  <span className="capitalize text-slate-600">{status.replaceAll('_', ' ')}</span>
                  <span className="font-bold tabular-nums text-slate-900">{count}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">Counts reflect current order records, not a selected reporting period.</p>
        </section>
      </div>

      {/* Dashboard actions stay task-focused; analysis is linked above once. */}
      <div className="w-full xl:max-w-2xl">
        <QuickActionsGrid />
      </div>
    </div>
  );
};