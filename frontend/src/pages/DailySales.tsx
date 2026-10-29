import React, { useEffect, useMemo, useState } from 'react';
import { Banknote, Calendar, Download, Search, ShoppingBag } from 'lucide-react';
import { getDailySales, type DailySalesOrder, type DailySalesSummary } from '../api';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { formatCurrency, formatDateInput, getStatusColor } from '../utils/helpers';
import { downloadCSV, toCSV } from '../utils/csv';
import { toast } from 'sonner';

export const DailySales: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(() => formatDateInput(new Date()));
  const [summary, setSummary] = useState<DailySalesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | DailySalesOrder['orderStatus']>('all');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getDailySales(selectedDate).then((result) => {
      if (active) setSummary(result);
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : 'Could not load Daily Sales from the backend.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [selectedDate]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (summary?.orders ?? []).filter((order) => {
      const matchesQuery = !query || order.referenceNumber.toLowerCase().includes(query)
        || order.customerName.toLowerCase().includes(query)
        || order.items.some((item) => item.name.toLowerCase().includes(query));
      return matchesQuery && (statusFilter === 'all' || order.orderStatus === statusFilter);
    });
  }, [search, statusFilter, summary]);
  const { visibleItems, sentinelRef, hasMore } = useInfiniteScroll(filteredOrders);

  const retry = () => {
    setLoading(true);
    setError(null);
    getDailySales(selectedDate).then(setSummary).catch((reason: unknown) => {
      setError(reason instanceof Error ? reason.message : 'Could not load Daily Sales from the backend.');
    }).finally(() => setLoading(false));
  };

  const exportCsv = () => {
    if (!summary?.orders.length) {
      toast.info('No backend sales records are available for this date.');
      return;
    }
    const rows = summary.orders.map((order) => ({
      reference: order.referenceNumber,
      customer: order.customerName,
      items: order.items.map((item) => `${item.name} × ${item.quantity}`).join('; '),
      gross: order.total,
      collected: order.paidAmount,
      refunded: order.refundedAmount,
      status: order.orderStatus,
      createdAt: order.createdAt,
    }));
    const csv = toCSV(rows, [
      { key: 'reference', header: 'Reference' },
      { key: 'customer', header: 'Customer' },
      { key: 'items', header: 'Items' },
      { key: 'gross', header: 'Gross Sales' },
      { key: 'collected', header: 'Collected' },
      { key: 'refunded', header: 'Refunded' },
      { key: 'status', header: 'Order Status' },
      { key: 'createdAt', header: 'Created At' },
    ]);
    downloadCSV(`smartstock-daily-sales-${selectedDate}.csv`, csv);
    toast.success(`Exported ${rows.length} backend sales records.`);
  };

  return (
    <section className="space-y-6 animate-fadeIn pb-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><Banknote className="h-5 w-5" /></span>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Daily Sales</h1>
            <p className="text-sm text-slate-500">Sales totals and order records loaded from the backend.</p>
          </div>
        </div>
        <button type="button" onClick={exportCsv} className="btn-secondary inline-flex items-center gap-2 self-start text-sm sm:self-auto">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </header>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <label htmlFor="daily-sales-date" className="flex items-center gap-2 text-sm font-semibold text-slate-600"><Calendar className="h-4 w-4" /> Sales date</label>
        <input id="daily-sales-date" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="input w-auto" />
        {summary && <span className="text-xs text-slate-500">{summary.orderCount} active · {summary.cancelledOrderCount} cancelled</span>}
      </div>

      {loading ? (
        <div role="status" className="rounded-3xl bg-white p-8 text-center text-slate-600">Loading Daily Sales from backend…</div>
      ) : error ? (
        <div role="alert" className="rounded-3xl border border-rose-200 bg-white p-8 text-center">
          <p className="font-semibold text-rose-700">Could not load Daily Sales: {error}</p>
          <button type="button" onClick={retry} className="btn-primary mt-4">Retry</button>
        </div>
      ) : summary && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Gross sales" amount={summary.grossSales} />
            <Metric label="Collected" amount={summary.collectedAmount} />
            <Metric label="Refunds" amount={summary.refundsAmount} />
            <Metric label="Net collected" amount={summary.netCollectedAmount} />
          </div>

          <section className="space-y-4 rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Sales orders <span className="text-sm font-medium text-slate-500">({filteredOrders.length})</span></h2>
                <p className="text-xs text-slate-500">Order records and totals are supplied by the backend.</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="relative">
                  <span className="sr-only">Search sales</span>
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search orders…" className="input !pl-9" />
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <span className="sr-only">Filter by order status</span>
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="input">
                    <option value="all">All statuses</option>
                    <option value="processing">Processing</option>
                    <option value="in_transit">In transit</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </label>
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-10 text-center text-sm text-slate-500">
                <ShoppingBag className="mx-auto mb-2 h-8 w-8 text-slate-300" />
                No backend sales records match this date and filter.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>
                    <th className="px-4 py-3">Reference / customer</th><th className="px-4 py-3">Items</th><th className="px-4 py-3 text-right">Gross</th><th className="px-4 py-3 text-right">Collected</th><th className="px-4 py-3 text-right">Refunded</th><th className="px-4 py-3">Status</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleItems.map((order) => <tr key={order.id} className="text-sm">
                      <td className="px-4 py-3"><span className="block font-mono font-bold text-slate-900">{order.referenceNumber}</span><span className="text-xs text-slate-500">{order.customerName}</span></td>
                      <td className="max-w-sm px-4 py-3 text-slate-600">{order.items.map((item) => `${item.name} × ${item.quantity}`).join(', ')}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatCurrency(order.total)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-700">{formatCurrency(order.paidAmount)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-rose-700">{formatCurrency(order.refundedAmount)}</td>
                      <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${getStatusColor(order.orderStatus)}`}>{order.orderStatus.replaceAll('_', ' ')}</span></td>
                    </tr>)}
                  </tbody>
                </table>
              </div>
            )}
            {hasMore && <div ref={sentinelRef} role="status" className="py-3 text-center text-xs text-slate-400">Scroll to load more sales…</div>}
          </section>
        </>
      )}
    </section>
  );
};

function Metric({ label, amount }: { label: string; amount: number }) {
  return <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-2 text-2xl font-black text-slate-900">{formatCurrency(amount)}</p>
  </div>;
}