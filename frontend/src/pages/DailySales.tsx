import React, { useState, useMemo, useEffect, useCallback } from 'react';

import {
  Banknote,
  Receipt,
  Calculator,
  Coins,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Printer,
  Download,
  Calendar,
  Search,
  History,
  Save,
  RotateCcw,
  Sparkles,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  X,
  CreditCard,
  Building2,
} from 'lucide-react';
import { useData } from '../components/DataContext';
import { useAuth } from '../components/AuthContext';
import type { Order } from '../types';
import { formatCurrency, formatDateInput, getStatusColor } from '../utils/helpers';
import { toCSV, downloadCSV } from '../utils/csv';
import { toast } from 'sonner';


interface DenominationCounts {
  d1000: number;
  d500: number;
  d200: number;
  d100: number;
  d50: number;
  d20: number;
  d10: number;
  d5: number;
  d1: number;
  coins: number;
}

const initialDenominations: DenominationCounts = {
  d1000: 0,
  d500: 0,
  d200: 0,
  d100: 0,
  d50: 0,
  d20: 0,
  d10: 0,
  d5: 0,
  d1: 0,
  coins: 0,
};

interface DailyReconciliationRecord {
  id: string;
  date: string;
  reconciledAt: string;
  cashierName: string;
  startingFloat: number;
  totalReceiptsAmount: number;
  receiptsCount: number;
  expectedCash: number;
  actualCash: number;
  variance: number;
  status: 'balanced' | 'shortage' | 'overage';
  denominations: DenominationCounts;
  notes: string;
}

const STORAGE_KEY = 'smartstock_daily_reconciliations';

export const DailySales: React.FC = () => {
  const { orders, products } = useData();
  const { user } = useAuth();

  // Find latest order date as default anchor
  const latestOrderDate = useMemo(() => {
    if (!orders || orders.length === 0) return formatDateInput(new Date());
    const timestamps = orders.map(o => new Date(o.date).getTime()).filter(t => !isNaN(t));
    if (timestamps.length === 0) return formatDateInput(new Date());
    return formatDateInput(new Date(Math.max(...timestamps)));
  }, [orders]);

  const [selectedDate, setSelectedDate] = useState<string>(() => latestOrderDate);

  // When latestOrderDate loads or changes, update if selectedDate was unset
  useEffect(() => {
    if (!selectedDate && latestOrderDate) {
      setSelectedDate(latestOrderDate);
    }
  }, [latestOrderDate, selectedDate]);

  // Drawer Starting Float (Default standard float ₱1,000 for change)
  const [startingFloat, setStartingFloat] = useState<number>(1000);

  // Cash denomination counts
  const [denominations, setDenominations] = useState<DenominationCounts>(initialDenominations);
  const [entryMode, setEntryMode] = useState<'denominations' | 'direct'>('denominations');
  const [directCash, setDirectCash] = useState<number>(0);

  // Payment method overrides for orders (cash vs digital)
  const [paymentMethodOverrides, setPaymentMethodOverrides] = useState<Record<string, 'cash' | 'gcash' | 'bank_transfer'>>({});

  // Audit sign-off form
  const [auditorName, setAuditorName] = useState<string>(() => user?.name || 'Kim Eduard Saludes');
  const [auditNotes, setAuditNotes] = useState<string>('');

  // Search & Filter within the day's receipts
  const [receiptSearch, setReceiptSearch] = useState<string>('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'digital'>('all');

  // Modal view for individual receipt
  const [selectedReceipt, setSelectedReceipt] = useState<Order | null>(null);

  // Historical reconciliation records from localStorage
  const [reconciledLogs, setReconciledLogs] = useState<DailyReconciliationRecord[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // fallback
    }
    // Seed initial realistic reconciliation history
    return [
      {
        id: 'REC-2026-0722',
        date: '2026-07-22',
        reconciledAt: '2026-07-22 18:30:00',
        cashierName: 'Kim Eduard Saludes',
        startingFloat: 1000,
        totalReceiptsAmount: 89925,
        receiptsCount: 2,
        expectedCash: 90925,
        actualCash: 90925,
        variance: 0,
        status: 'balanced',
        denominations: { ...initialDenominations, d1000: 90, d500: 1, d200: 2, d20: 1, d5: 1 },
        notes: 'End of day register closed. Physical cash matches receipts exactly. Cash deposited to safe.'
      },
      {
        id: 'REC-2026-0719',
        date: '2026-07-19',
        reconciledAt: '2026-07-19 18:15:00',
        cashierName: 'Hazel Store Admin',
        startingFloat: 1000,
        totalReceiptsAmount: 45200,
        receiptsCount: 2,
        expectedCash: 46200,
        actualCash: 46200,
        variance: 0,
        status: 'balanced',
        denominations: { ...initialDenominations, d1000: 45, d500: 2, d200: 1 },
        notes: 'All delivery and pickup receipts verified.'
      }
    ];
  });

  // Save logs to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reconciledLogs));
    } catch {
      // ignore
    }
  }, [reconciledLogs]);

  // Orders for the chosen date
  const ordersToday = useMemo(() => {
    return orders.filter(o => o.date === selectedDate);
  }, [orders, selectedDate]);

  const activeOrdersToday = useMemo(() => {
    return ordersToday.filter(o => o.orderStatus !== 'cancelled');
  }, [ordersToday]);


  // Determine payment method for an order
  const getOrderPaymentMethod = useCallback((order: Order): 'cash' | 'gcash' | 'bank_transfer' => {
    if (paymentMethodOverrides[order.id]) {
      return paymentMethodOverrides[order.id];
    }
    const note = (order.notes || '').toLowerCase();
    if (note.includes('gcash')) return 'gcash';
    if (note.includes('bank') || note.includes('transfer')) return 'bank_transfer';
    // Default pickup/delivery to cash on delivery / cash in store
    return 'cash';
  }, [paymentMethodOverrides]);

  const togglePaymentMethod = (orderId: string, currentMethod: 'cash' | 'gcash' | 'bank_transfer') => {
    const nextMethod = currentMethod === 'cash' ? 'gcash' : currentMethod === 'gcash' ? 'bank_transfer' : 'cash';
    setPaymentMethodOverrides(prev => ({
      ...prev,
      [orderId]: nextMethod,
    }));
    toast.info(`Updated order ${orderId} payment to ${nextMethod.toUpperCase()}`);
  };

  // Financial aggregates for the day
  const grossSalesToday = useMemo(() => {
    return activeOrdersToday.reduce((sum, o) => sum + o.total, 0);
  }, [activeOrdersToday]);

  const totalPaidToday = useMemo(() => {
    return activeOrdersToday.reduce((sum, o) => sum + (o.paidAmount || 0), 0);
  }, [activeOrdersToday]);

  const totalRefundsToday = useMemo(() => {
    return ordersToday.reduce((sum, o) => sum + (o.refundAmount || 0), 0);
  }, [ordersToday]);

  const netSalesToday = totalPaidToday - totalRefundsToday;

  // Breakdown by Cash vs Digital Payments
  const cashReceipts = useMemo(() => {
    return activeOrdersToday.filter(o => getOrderPaymentMethod(o) === 'cash');
  }, [activeOrdersToday, getOrderPaymentMethod]);

  const digitalReceipts = useMemo(() => {
    return activeOrdersToday.filter(o => getOrderPaymentMethod(o) !== 'cash');
  }, [activeOrdersToday, getOrderPaymentMethod]);


  const totalCashReceipts = useMemo(() => {
    return cashReceipts.reduce((sum, o) => sum + (o.paidAmount || 0), 0);
  }, [cashReceipts]);

  const totalDigitalReceipts = useMemo(() => {
    return digitalReceipts.reduce((sum, o) => sum + (o.paidAmount || 0), 0);
  }, [digitalReceipts]);

  // Expected Physical Cash in Drawer = Float + Cash Sales - Cash Refunds
  const expectedCashInDrawer = useMemo(() => {
    return Math.max(0, startingFloat + totalCashReceipts - totalRefundsToday);
  }, [startingFloat, totalCashReceipts, totalRefundsToday]);

  // Actual Physical Cash on Hand Counted
  const totalCountedCash = useMemo(() => {
    if (entryMode === 'direct') {
      return directCash;
    }
    return (
      denominations.d1000 * 1000 +
      denominations.d500 * 500 +
      denominations.d200 * 200 +
      denominations.d100 * 100 +
      denominations.d50 * 50 +
      denominations.d20 * 20 +
      denominations.d10 * 10 +
      denominations.d5 * 5 +
      denominations.d1 * 1 +
      denominations.coins
    );
  }, [entryMode, directCash, denominations]);

  // Discrepancy / Variance
  const variance = totalCountedCash - expectedCashInDrawer;
  const isBalanced = Math.abs(variance) < 0.01;
  const isShortage = variance < -0.01;


  // Material Breakdown for today's sales (Glass vs Aluminum)
  const categoryStats = useMemo(() => {
    let glassTotal = 0;
    let glassQty = 0;
    let aluminumTotal = 0;
    let aluminumQty = 0;

    activeOrdersToday.forEach(order => {
      order.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        const cat = prod?.category || (item.productName.toLowerCase().includes('glass') ? 'glass' : 'aluminum');
        if (cat === 'glass') {
          glassTotal += item.total;
          glassQty += item.quantity;
        } else {
          aluminumTotal += item.total;
          aluminumQty += item.quantity;
        }
      });
    });

    const sum = glassTotal + aluminumTotal;
    const glassPct = sum > 0 ? Math.round((glassTotal / sum) * 100) : 50;
    const aluminumPct = sum > 0 ? 100 - glassPct : 50;

    return { glassTotal, glassQty, aluminumTotal, aluminumQty, glassPct, aluminumPct };
  }, [activeOrdersToday, products]);

  // Filtered receipts for audit table
  const filteredReceipts = useMemo(() => {
    return ordersToday.filter(order => {
      const q = receiptSearch.toLowerCase().trim();
      const matchesSearch = !q ||
        order.referenceNumber.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.items.some(i => i.productName.toLowerCase().includes(q));

      const method = getOrderPaymentMethod(order);
      const matchesPayment =
        paymentFilter === 'all' ||
        (paymentFilter === 'cash' && method === 'cash') ||
        (paymentFilter === 'digital' && method !== 'cash');

      return matchesSearch && matchesPayment;
    });
  }, [ordersToday, receiptSearch, paymentFilter, getOrderPaymentMethod]);


  // Auto-fill denominations to match expected cash
  const handleAutoMatch = () => {
    let remaining = expectedCashInDrawer;
    const newDenoms: DenominationCounts = { ...initialDenominations };

    const denomValues: [keyof DenominationCounts, number][] = [
      ['d1000', 1000],
      ['d500', 500],
      ['d200', 200],
      ['d100', 100],
      ['d50', 50],
      ['d20', 20],
      ['d10', 10],
      ['d5', 5],
      ['d1', 1],
    ];

    for (const [key, val] of denomValues) {
      if (remaining >= val) {
        const count = Math.floor(remaining / val);
        newDenoms[key] = count;
        remaining -= count * val;
      }
    }

    newDenoms.coins = Math.round(remaining * 100) / 100;
    setDenominations(newDenoms);
    setDirectCash(expectedCashInDrawer);
    toast.success(`Drawer counts matched to expected cash: ${formatCurrency(expectedCashInDrawer)}`);
  };

  const handleSimulateDiscrepancy = (delta: number) => {
    handleAutoMatch();
    if (entryMode === 'direct') {
      setDirectCash(prev => Math.max(0, prev + delta));
    } else {
      if (delta > 0) {
        setDenominations(prev => ({ ...prev, d100: prev.d100 + 1 }));
      } else {
        setDenominations(prev => ({ ...prev, d100: Math.max(0, prev.d100 - 1) }));
      }
    }
    toast.info(`Simulated ${delta > 0 ? '+₱100 overage' : '-₱100 shortage'} for audit testing.`);
  };

  const handleResetCounts = () => {
    setDenominations(initialDenominations);
    setDirectCash(0);
    toast.info('Cash drawer counts reset to zero.');
  };

  const handleSaveAudit = () => {
    const record: DailyReconciliationRecord = {
      id: `REC-${selectedDate.replace(/-/g, '')}-${Date.now().toString(36).slice(-4).toUpperCase()}`,
      date: selectedDate,
      reconciledAt: new Date().toLocaleString(),
      cashierName: auditorName.trim() || user?.name || 'Staff Auditor',
      startingFloat,
      totalReceiptsAmount: grossSalesToday,
      receiptsCount: activeOrdersToday.length,
      expectedCash: expectedCashInDrawer,
      actualCash: totalCountedCash,
      variance,
      status: isBalanced ? 'balanced' : isShortage ? 'shortage' : 'overage',
      denominations: { ...denominations },
      notes: auditNotes.trim() || (isBalanced ? 'All receipts balanced with cash held.' : `Discrepancy of ${formatCurrency(variance)} noted.`),
    };

    setReconciledLogs(prev => [record, ...prev.filter(r => r.date !== selectedDate)]);
    toast.success(`Daily sales & cash audit for ${selectedDate} saved successfully!`);
  };

  const handleLoadPastAudit = (record: DailyReconciliationRecord) => {
    setSelectedDate(record.date);
    setStartingFloat(record.startingFloat);
    setDenominations(record.denominations);
    setDirectCash(record.actualCash);
    setAuditorName(record.cashierName);
    setAuditNotes(record.notes);
    toast.info(`Loaded audit record from ${record.date} (${record.status.toUpperCase()})`);
  };

  const handlePrint = () => {
    toast.info('Opening print dialog for Daily Cash Reconciliation Sheet...');
    window.print();
  };

  const handleExportCSV = () => {
    if (ordersToday.length === 0) {
      toast.warning('No orders found on this date to export.');
      return;
    }

    const rows = ordersToday.map(o => ({
      referenceNumber: o.referenceNumber,
      date: o.date,
      customerName: o.customerName,
      contact: o.contact,
      items: o.items.map(i => `${i.productName} (x${i.quantity})`).join('; '),
      paymentMethod: getOrderPaymentMethod(o).toUpperCase(),
      totalAmount: o.total,
      paidAmount: o.paidAmount,
      refundAmount: o.refundAmount,
      orderStatus: o.orderStatus,
    }));

    const columns: { key: keyof typeof rows[0]; header: string }[] = [
      { key: 'referenceNumber', header: 'Receipt / Ref #' },
      { key: 'date', header: 'Date' },
      { key: 'customerName', header: 'Customer' },
      { key: 'contact', header: 'Contact' },
      { key: 'items', header: 'Items Purchased' },
      { key: 'paymentMethod', header: 'Payment Method' },
      { key: 'totalAmount', header: 'Total (PHP)' },
      { key: 'paidAmount', header: 'Paid Amount (PHP)' },
      { key: 'refundAmount', header: 'Refund (PHP)' },
      { key: 'orderStatus', header: 'Status' },
    ];

    const csvData = toCSV(rows, columns);
    downloadCSV(`smartstock-daily-sales-audit-${selectedDate}.csv`, csvData);
    toast.success(`Exported ${ordersToday.length} receipt records to CSV.`);
  };

  // Date Navigation
  const handleShiftDate = (days: number) => {
    const current = new Date(selectedDate);
    if (isNaN(current.getTime())) return;
    current.setDate(current.getDate() + days);
    setSelectedDate(formatDateInput(current));
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-12">
      {/* ── 1. Page Header with Date Selector & Print/Export Actions ───────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-[#4f46e5] flex items-center justify-center shrink-0 shadow-2xs">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-[-0.02em]">
                Daily Sales &amp; Cash Reconciliation
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                End-of-day cash balancing against registered sales receipts &amp; audit ledger.
              </p>
            </div>
          </div>
        </div>

        {/* Actions Button Group */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto no-print">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl border border-slate-200/80 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-all"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold shadow-md shadow-slate-900/10 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print EOD Z-Reading</span>
          </button>
        </div>
      </div>

      {/* ── 2. Date Navigation Toolbar Card ────────────────────────────────────── */}
      <div className="bg-white rounded-[28px] p-5 sm:p-6 border border-[#f1f5f9] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        {/* Left: Quick Day Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Audit Date:</span>
          </div>

          <button
            type="button"
            onClick={() => setSelectedDate(latestOrderDate)}
            className={`rounded-2xl px-3.5 py-1.5 text-xs font-bold transition-all ${
              selectedDate === latestOrderDate
                ? 'bg-[#4f46e5] text-white shadow-md shadow-indigo-900/20'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70'
            }`}
          >
            Latest Sales Day ({latestOrderDate})
          </button>

          <button
            type="button"
            onClick={() => setSelectedDate(formatDateInput(new Date()))}
            className={`rounded-2xl px-3.5 py-1.5 text-xs font-bold transition-all ${
              selectedDate === formatDateInput(new Date())
                ? 'bg-[#4f46e5] text-white shadow-md shadow-indigo-900/20'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70'
            }`}
          >
            Today
          </button>

          <button
            type="button"
            onClick={() => {
              const yest = new Date();
              yest.setDate(yest.getDate() - 1);
              setSelectedDate(formatDateInput(yest));
            }}
            className="rounded-2xl px-3.5 py-1.5 text-xs font-bold bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70 transition-all"
          >
            Yesterday
          </button>
        </div>

        {/* Right: Specific Date Picker with Prev/Next Steppers */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => handleShiftDate(-1)}
            title="Previous Day"
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80 transition-colors shadow-2xs"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5">
            <label htmlFor="daily-sales-date" className="sr-only">Audit Date</label>
            <input
              id="daily-sales-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-xl border border-slate-200/80 bg-slate-50/50 px-3.5 py-1.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-[#4f46e5] focus:outline-none transition-all shadow-2xs"
            />
          </div>

          <button
            type="button"
            onClick={() => handleShiftDate(1)}
            title="Next Day"
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80 transition-colors shadow-2xs"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <span className="text-xs font-semibold text-slate-400 pl-1 hidden lg:inline">
            ({ordersToday.length} {ordersToday.length === 1 ? 'receipt' : 'receipts'} on this date)
          </span>
        </div>
      </div>

      {/* ── 3. High-Level Reconciliation Summary (4-Card Metric Row) ───────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Registered Receipts Total */}
        <div className="bg-white rounded-[28px] p-6 border border-[#f1f5f9] shadow-sm micro-hover flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#10b981] flex items-center justify-center shadow-2xs">
              <Receipt className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100/60">
              {activeOrdersToday.length} receipts issued
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
              Total Receipts (Gross Sales)
            </p>
            <p className="text-2xl sm:text-[26px] font-black text-slate-900 tracking-tight leading-none">
              {formatCurrency(grossSalesToday)}
            </p>
            <p className="text-xs text-slate-500 font-medium">
              Net collected: <span className="font-bold text-slate-700">{formatCurrency(netSalesToday)}</span>
            </p>
          </div>
        </div>

        {/* Card 2: Expected Cash in Drawer */}
        <div className="bg-white rounded-[28px] p-6 border border-[#f1f5f9] shadow-sm micro-hover flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-[#4f46e5] flex items-center justify-center shadow-2xs">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-[#4f46e5] text-xs font-bold border border-indigo-100/60">
              Float: {formatCurrency(startingFloat)}
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
              Expected Cash on Hand
            </p>
            <p className="text-2xl sm:text-[26px] font-black text-slate-900 tracking-tight leading-none">
              {formatCurrency(expectedCashInDrawer)}
            </p>
            <p className="text-xs text-slate-500 font-medium">
              Cash receipts: <span className="font-bold text-slate-700">{formatCurrency(totalCashReceipts)}</span>
            </p>
          </div>
        </div>

        {/* Card 3: Actual Cash Held / Counted */}
        <div className="bg-white rounded-[28px] p-6 border border-[#f1f5f9] shadow-sm micro-hover flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-2xs">
              <Coins className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-100/60">
              {entryMode === 'denominations' ? 'Denominations count' : 'Direct count'}
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
              Actual Cash Counted (Held)
            </p>
            <p className="text-2xl sm:text-[26px] font-black text-slate-900 tracking-tight leading-none">
              {formatCurrency(totalCountedCash)}
            </p>
            <p className="text-xs text-slate-500 font-medium">
              Physical count from drawer
            </p>
          </div>
        </div>

        {/* Card 4: Reconciliation Variance (The Core Check) */}
        <div
          className={`rounded-[28px] p-6 border shadow-sm micro-hover flex flex-col justify-between transition-all ${
            isBalanced
              ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-900'
              : isShortage
              ? 'bg-rose-50/70 border-rose-200/80 text-rose-900'
              : 'bg-indigo-50/70 border-indigo-200/80 text-indigo-900'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-2xs ${
                isBalanced
                  ? 'bg-emerald-100 text-emerald-700'
                  : isShortage
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-indigo-100 text-indigo-700'
              }`}
            >
              {isBalanced ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : isShortage ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <TrendingUp className="w-5 h-5" />
              )}
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wide border ${
                isBalanced
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  : isShortage
                  ? 'bg-rose-100 text-rose-800 border-rose-200 animate-pulse'
                  : 'bg-indigo-100 text-indigo-800 border-indigo-200'
              }`}
            >
              {isBalanced ? 'Balanced' : isShortage ? 'Shortage' : 'Overage'}
            </span>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] opacity-75">
              Reconciliation Discrepancy
            </p>
            <p className="text-2xl sm:text-[26px] font-black tracking-tight leading-none">
              {isBalanced ? '₱0.00' : (variance > 0 ? `+${formatCurrency(variance)}` : formatCurrency(variance))}
            </p>
            <p className="text-xs font-semibold opacity-85">
              {isBalanced
                ? 'Exact match with registered receipts'
                : isShortage
                ? 'Cash held is less than receipts'
                : 'Cash held exceeds receipts'}
            </p>
          </div>
        </div>
      </div>

      {/* ── 4. Discrepancy Alert Banner ────────────────────────────────────────── */}
      <div
        className={`rounded-2xl p-4 border flex items-start gap-3.5 transition-all shadow-2xs ${
          isBalanced
            ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
            : isShortage
            ? 'bg-rose-50/70 border-rose-200 text-rose-900'
            : 'bg-indigo-50/60 border-indigo-200 text-indigo-900'
        }`}
      >
        <div className="mt-0.5 shrink-0">
          {isBalanced ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          ) : isShortage ? (
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          ) : (
            <TrendingUp className="w-5 h-5 text-indigo-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold">
            {isBalanced
              ? 'End-of-Day Balancing: Perfect Match'
              : isShortage
              ? `End-of-Day Balancing: Cash Shortage Detected of ${formatCurrency(Math.abs(variance))}`
              : `End-of-Day Balancing: Cash Overage Detected of ${formatCurrency(variance)}`}
          </p>
          <p className="text-xs mt-0.5 leading-relaxed opacity-90">
            {isBalanced
              ? `The physical cash drawer holding (${formatCurrency(totalCountedCash)}) perfectly equals the expected drawer total (Starting float of ${formatCurrency(startingFloat)} + ${formatCurrency(totalCashReceipts)} cash receipts - ${formatCurrency(totalRefundsToday)} refunds).`
              : isShortage
              ? `Physical cash held (${formatCurrency(totalCountedCash)}) is short by ${formatCurrency(Math.abs(variance))} against the expected receipts total (${formatCurrency(expectedCashInDrawer)}). Please verify receipt records or enter discrepancy rationale in the audit sign-off.`
              : `Physical cash held (${formatCurrency(totalCountedCash)}) has a surplus of ${formatCurrency(variance)} compared to registered receipts (${formatCurrency(expectedCashInDrawer)}). Check if a cash sale was unrecorded in the system.`}
          </p>
        </div>
      </div>

      {/* ── 5. Main Split Section: Physical Cash Counter vs Expected Verification ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7-Cols: Physical Cash Held (Drawer Counter / Denominations) */}
        <div className="lg:col-span-7 bg-white rounded-[28px] p-6 border border-[#f1f5f9] shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#f1f5f9]">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-[#4f46e5]" />
                Physical Cash on Hand (Drawer Count)
              </h2>
              <p className="text-xs text-slate-500">
                Count the physical peso bills and coins held at closing.
              </p>
            </div>

            {/* Mode switch (Denominations vs Direct) */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start sm:self-auto no-print">
              <button
                type="button"
                onClick={() => setEntryMode('denominations')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  entryMode === 'denominations'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Denominations
              </button>
              <button
                type="button"
                onClick={() => setEntryMode('direct')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  entryMode === 'direct'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Direct Amount
              </button>
            </div>
          </div>

          {/* Drawer Float Setting */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100">
            <div>
              <span className="text-xs font-bold text-slate-700 block">
                Beginning Drawer Float (Petty Cash for Change)
              </span>
              <span className="text-[11px] text-slate-400">
                Base change cash in drawer before opening sales
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">₱</span>
              <input
                type="number"
                min="0"
                step="50"
                value={startingFloat}
                onChange={(e) => setStartingFloat(Math.max(0, Number(e.target.value) || 0))}
                className="w-28 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-900 focus:border-[#4f46e5] focus:outline-none shadow-2xs text-right"
              />
            </div>
          </div>

          {entryMode === 'denominations' ? (
            /* Philippine Peso Denomination Breakdown Grid */
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* ₱1,000 Bill */}
                <div className="p-3 rounded-2xl border border-slate-100 bg-[#f8fafc]/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-12 py-1 rounded-lg bg-indigo-100 text-indigo-800 text-xs font-black text-center shadow-2xs">
                      ₱1,000
                    </span>
                    <span className="text-xs font-semibold text-slate-500">bills</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={denominations.d1000 || ''}
                      placeholder="0"
                      onChange={(e) => setDenominations(prev => ({ ...prev, d1000: Math.max(0, parseInt(e.target.value) || 0) }))}
                      className="w-16 rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-center focus:border-[#4f46e5] focus:outline-none"
                    />
                    <span className="w-20 text-right text-xs font-bold text-slate-800">
                      {formatCurrency(denominations.d1000 * 1000)}
                    </span>
                  </div>
                </div>

                {/* ₱500 Bill */}
                <div className="p-3 rounded-2xl border border-slate-100 bg-[#f8fafc]/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-12 py-1 rounded-lg bg-amber-100 text-amber-800 text-xs font-black text-center shadow-2xs">
                      ₱500
                    </span>
                    <span className="text-xs font-semibold text-slate-500">bills</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={denominations.d500 || ''}
                      placeholder="0"
                      onChange={(e) => setDenominations(prev => ({ ...prev, d500: Math.max(0, parseInt(e.target.value) || 0) }))}
                      className="w-16 rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-center focus:border-[#4f46e5] focus:outline-none"
                    />
                    <span className="w-20 text-right text-xs font-bold text-slate-800">
                      {formatCurrency(denominations.d500 * 500)}
                    </span>
                  </div>
                </div>

                {/* ₱200 Bill */}
                <div className="p-3 rounded-2xl border border-slate-100 bg-[#f8fafc]/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-12 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-black text-center shadow-2xs">
                      ₱200
                    </span>
                    <span className="text-xs font-semibold text-slate-500">bills</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={denominations.d200 || ''}
                      placeholder="0"
                      onChange={(e) => setDenominations(prev => ({ ...prev, d200: Math.max(0, parseInt(e.target.value) || 0) }))}
                      className="w-16 rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-center focus:border-[#4f46e5] focus:outline-none"
                    />
                    <span className="w-20 text-right text-xs font-bold text-slate-800">
                      {formatCurrency(denominations.d200 * 200)}
                    </span>
                  </div>
                </div>

                {/* ₱100 Bill */}
                <div className="p-3 rounded-2xl border border-slate-100 bg-[#f8fafc]/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-12 py-1 rounded-lg bg-violet-100 text-violet-800 text-xs font-black text-center shadow-2xs">
                      ₱100
                    </span>
                    <span className="text-xs font-semibold text-slate-500">bills</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={denominations.d100 || ''}
                      placeholder="0"
                      onChange={(e) => setDenominations(prev => ({ ...prev, d100: Math.max(0, parseInt(e.target.value) || 0) }))}
                      className="w-16 rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-center focus:border-[#4f46e5] focus:outline-none"
                    />
                    <span className="w-20 text-right text-xs font-bold text-slate-800">
                      {formatCurrency(denominations.d100 * 100)}
                    </span>
                  </div>
                </div>

                {/* ₱50 Bill */}
                <div className="p-3 rounded-2xl border border-slate-100 bg-[#f8fafc]/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-12 py-1 rounded-lg bg-rose-100 text-rose-800 text-xs font-black text-center shadow-2xs">
                      ₱50
                    </span>
                    <span className="text-xs font-semibold text-slate-500">bills</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={denominations.d50 || ''}
                      placeholder="0"
                      onChange={(e) => setDenominations(prev => ({ ...prev, d50: Math.max(0, parseInt(e.target.value) || 0) }))}
                      className="w-16 rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-center focus:border-[#4f46e5] focus:outline-none"
                    />
                    <span className="w-20 text-right text-xs font-bold text-slate-800">
                      {formatCurrency(denominations.d50 * 50)}
                    </span>
                  </div>
                </div>

                {/* ₱20 Bill / Coin */}
                <div className="p-3 rounded-2xl border border-slate-100 bg-[#f8fafc]/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-12 py-1 rounded-lg bg-orange-100 text-orange-800 text-xs font-black text-center shadow-2xs">
                      ₱20
                    </span>
                    <span className="text-xs font-semibold text-slate-500">bills/coins</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={denominations.d20 || ''}
                      placeholder="0"
                      onChange={(e) => setDenominations(prev => ({ ...prev, d20: Math.max(0, parseInt(e.target.value) || 0) }))}
                      className="w-16 rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-center focus:border-[#4f46e5] focus:outline-none"
                    />
                    <span className="w-20 text-right text-xs font-bold text-slate-800">
                      {formatCurrency(denominations.d20 * 20)}
                    </span>
                  </div>
                </div>

                {/* ₱10 Coins */}
                <div className="p-3 rounded-2xl border border-slate-100 bg-[#f8fafc]/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-12 py-1 rounded-lg bg-slate-200 text-slate-700 text-xs font-black text-center shadow-2xs">
                      ₱10
                    </span>
                    <span className="text-xs font-semibold text-slate-500">coins</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={denominations.d10 || ''}
                      placeholder="0"
                      onChange={(e) => setDenominations(prev => ({ ...prev, d10: Math.max(0, parseInt(e.target.value) || 0) }))}
                      className="w-16 rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-center focus:border-[#4f46e5] focus:outline-none"
                    />
                    <span className="w-20 text-right text-xs font-bold text-slate-800">
                      {formatCurrency(denominations.d10 * 10)}
                    </span>
                  </div>
                </div>

                {/* Loose Coins (₱5, ₱1, cents) */}
                <div className="p-3 rounded-2xl border border-slate-100 bg-[#f8fafc]/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-12 py-1 rounded-lg bg-slate-200 text-slate-700 text-xs font-black text-center shadow-2xs">
                      Loose
                    </span>
                    <span className="text-xs font-semibold text-slate-500">coins (₱)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={denominations.coins || ''}
                      placeholder="0"
                      onChange={(e) => setDenominations(prev => ({ ...prev, coins: Math.max(0, parseFloat(e.target.value) || 0) }))}
                      className="w-16 rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-center focus:border-[#4f46e5] focus:outline-none"
                    />
                    <span className="w-20 text-right text-xs font-bold text-slate-800">
                      {formatCurrency(denominations.coins)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Total Counted Footnote */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Total Counted Cash on Hand
                </span>
                <span className="text-xl font-black text-slate-900 font-mono">
                  {formatCurrency(totalCountedCash)}
                </span>
              </div>
            </div>
          ) : (
            /* Direct Cash Entry Mode */
            <div className="space-y-4 p-6 bg-slate-50/50 rounded-2xl border border-slate-100 text-center">
              <label htmlFor="direct-cash-input" className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Enter Total Physical Cash on Hand (PHP)
              </label>
              <div className="max-w-xs mx-auto relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-slate-400">₱</span>
                <input
                  id="direct-cash-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={directCash || ''}
                  placeholder="0.00"
                  onChange={(e) => setDirectCash(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-2xl font-black text-slate-900 focus:border-[#4f46e5] focus:outline-none shadow-sm text-center"
                />
              </div>
              <p className="text-[11px] text-slate-400">
                Quick entry mode if cash has already been tallied on a physical bill counter.
              </p>
            </div>
          )}

          {/* Quick Action Helpers */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 no-print">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleAutoMatch}
                title="Automatically set denominations to match expected cash"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-[#4f46e5] hover:bg-indigo-100 text-xs font-bold transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Quick Match Expected ({formatCurrency(expectedCashInDrawer)})</span>
              </button>

              <button
                type="button"
                onClick={() => handleSimulateDiscrepancy(-100)}
                title="Simulate a ₱100 cash shortage to test alert"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-semibold transition-colors"
              >
                <span>-₱100 Short</span>
              </button>

              <button
                type="button"
                onClick={() => handleSimulateDiscrepancy(100)}
                title="Simulate a ₱100 cash overage to test alert"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-semibold transition-colors"
              >
                <span>+₱100 Over</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleResetCounts}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Count</span>
            </button>
          </div>
        </div>

        {/* Right 5-Cols: Receipts Verification & Sign-off Card */}
        <div className="lg:col-span-5 space-y-6">
          {/* Expected Drawer Calculation Card */}
          <div className="bg-white rounded-[28px] p-6 border border-[#f1f5f9] shadow-sm space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-emerald-600" />
              Expected Cash Formula
            </h2>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Starting Drawer Float</span>
                <span className="font-bold text-slate-800">+{formatCurrency(startingFloat)}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Cash Receipts Collected ({cashReceipts.length} orders)</span>
                <span className="font-bold text-emerald-600">+{formatCurrency(totalCashReceipts)}</span>
              </div>

              {totalRefundsToday > 0 && (
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Cash Refunds Deducted</span>
                  <span className="font-bold text-rose-600">-{formatCurrency(totalRefundsToday)}</span>
                </div>
              )}

              <div className="flex justify-between py-2 border-t-2 border-slate-200 text-sm">
                <span className="font-extrabold text-slate-900">Total Expected Cash in Drawer</span>
                <span className="font-black text-slate-900 font-mono">{formatCurrency(expectedCashInDrawer)}</span>
              </div>
            </div>

            {/* Non-Cash Receipts Notice */}
            <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-100/80 space-y-1 text-xs">
              <div className="flex items-center justify-between font-bold text-blue-900">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  Digital / Bank Payments ({digitalReceipts.length} orders)
                </span>
                <span>{formatCurrency(totalDigitalReceipts)}</span>
              </div>
              <p className="text-[11px] text-blue-700 leading-relaxed">
                Deposited directly to company bank / GCash account. Not part of physical drawer count.
              </p>
            </div>
          </div>

          {/* End-of-Day Audit Sign-Off Form */}
          <div className="bg-white rounded-[28px] p-6 border border-[#f1f5f9] shadow-sm space-y-4 no-print">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-600" />
              Audit Sign-Off &amp; Record
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <label htmlFor="auditor-name" className="font-bold text-slate-600 block mb-1">
                  Cashier / Auditor Name
                </label>
                <input
                  id="auditor-name"
                  type="text"
                  value={auditorName}
                  onChange={(e) => setAuditorName(e.target.value)}
                  placeholder="e.g. Kim Eduard Saludes"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#4f46e5] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="audit-notes" className="font-bold text-slate-600 block mb-1">
                  Closing Notes / Discrepancy Rationale
                </label>
                <textarea
                  id="audit-notes"
                  rows={2}
                  value={auditNotes}
                  onChange={(e) => setAuditNotes(e.target.value)}
                  placeholder={isBalanced ? 'Register balanced. Cash verified and stored.' : 'Describe reason for shortage or overage...'}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs text-slate-800 focus:bg-white focus:border-[#4f46e5] focus:outline-none leading-relaxed"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveAudit}
                className="w-full py-2.5 rounded-2xl bg-[#4f46e5] text-white hover:bg-indigo-700 text-xs font-extrabold flex items-center justify-center gap-2 shadow-md shadow-indigo-900/20 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Save &amp; Finalize Daily Reconciliation</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 6. Daily Material Sales Analytics (Glass vs Aluminum Breakdown) ──────── */}
      <div className="bg-white rounded-[28px] p-6 border border-[#f1f5f9] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Daily Material Sales Volume Breakdown
            </h2>
            <p className="text-xs text-slate-500">
              Registered sales categorized by Glass and Aluminum profiles for {selectedDate}.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400">
            Total Sales: {formatCurrency(grossSalesToday)}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Float & Tempered Glass */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xs shadow-2xs">
                GL
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Float &amp; Tempered Glass</p>
                <p className="text-[11px] text-slate-500">{categoryStats.glassQty} sqm / units sold</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-base font-black text-emerald-700">{formatCurrency(categoryStats.glassTotal)}</p>
              <p className="text-[10px] font-extrabold text-emerald-600">{categoryStats.glassPct}% of day</p>
            </div>
          </div>

          {/* Aluminum Profiles */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs shadow-2xs">
                AL
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Aluminum Profiles</p>
                <p className="text-[11px] text-slate-500">{categoryStats.aluminumQty} lengths / units sold</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-base font-black text-[#4f46e5]">{formatCurrency(categoryStats.aluminumTotal)}</p>
              <p className="text-[10px] font-extrabold text-[#4f46e5]">{categoryStats.aluminumPct}% of day</p>
            </div>
          </div>
        </div>

        {/* Progress distribution bar */}
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
          <div
            className="bg-emerald-500 h-2.5 transition-all duration-500"
            style={{ width: `${categoryStats.glassPct}%` }}
            title={`Glass: ${categoryStats.glassPct}%`}
          />
          <div
            className="bg-[#4f46e5] h-2.5 transition-all duration-500"
            style={{ width: `${categoryStats.aluminumPct}%` }}
            title={`Aluminum: ${categoryStats.aluminumPct}%`}
          />
        </div>
      </div>

      {/* ── 7. Receipts Audit Ledger Table ─────────────────────────────────────── */}
      <div className="bg-white rounded-[28px] p-6 border border-[#f1f5f9] shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-indigo-600" />
              Receipts Audit Ledger ({ordersToday.length})
            </h2>
            <p className="text-xs text-slate-500">
              Itemized sales receipts issued on {selectedDate}. Toggle payment method if misclassified.
            </p>
          </div>

          {/* Table search & payment filter */}
          <div className="flex flex-wrap items-center gap-2.5 no-print">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={receiptSearch}
                onChange={(e) => setReceiptSearch(e.target.value)}
                placeholder="Search receipt, customer..."
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-[#4f46e5] focus:outline-none w-48 sm:w-56"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              {(['all', 'cash', 'digital'] as const).map(f => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setPaymentFilter(f)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                    paymentFilter === f
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {f === 'all' ? 'All' : f === 'cash' ? 'Cash' : 'Digital'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table Content */}
        {filteredReceipts.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs space-y-2">
            <Receipt className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
            <p className="font-bold text-slate-600">No receipts found for {selectedDate}</p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              No sales orders match your active filter. Use the date picker above to inspect dates with recorded transactions.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/80 border-b border-[#f1f5f9]">
                <tr>
                  <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Receipt / Ref #</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Items Summary</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Payment Method</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Total Bill</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Paid Amount</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider no-print">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {filteredReceipts.map((order) => {
                  const method = getOrderPaymentMethod(order);
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/60 transition-colors text-xs">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        {order.referenceNumber}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {order.customerName}
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={order.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}>
                        {order.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => togglePaymentMethod(order.id, method)}
                          title="Click to toggle Cash / GCash / Bank Transfer"
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all shadow-2xs no-print ${
                            method === 'cash'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100'
                              : method === 'gcash'
                              ? 'bg-sky-50 text-sky-700 border border-sky-200/80 hover:bg-sky-100'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 hover:bg-indigo-100'
                          }`}
                        >
                          {method === 'cash' ? <Coins className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
                          <span className="uppercase">{method.replace('_', ' ')}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="px-4 py-3 text-right font-black text-emerald-700 font-mono">
                        {formatCurrency(order.paidAmount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(order.orderStatus)}`}>
                          {order.orderStatus.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right no-print">
                        <button
                          type="button"
                          onClick={() => setSelectedReceipt(order)}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-[#4f46e5] text-xs font-bold transition-colors"
                        >
                          View Slip
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 8. Historical Reconciliation Log (Audits Table) ────────────────────── */}
      <div className="bg-white rounded-[28px] p-6 border border-[#f1f5f9] shadow-sm space-y-4 no-print">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" />
              Past Daily Reconciliations Log
            </h2>
            <p className="text-xs text-slate-500">
              Audit trail of previously submitted end-of-day register balancing records.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80 border-b border-[#f1f5f9]">
              <tr>
                <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Audit Date</th>
                <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Auditor / Cashier</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Expected Cash</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Counted Cash</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Variance</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">Result</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Audit Notes</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {reconciledLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60 transition-colors text-xs">
                  <td className="px-4 py-3 font-bold text-slate-900 font-mono">
                    {log.date}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-700">
                    {log.cashierName}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-slate-700 font-mono">
                    {formatCurrency(log.expectedCash)}
                  </td>
                  <td className="px-4 py-3 text-right font-black text-slate-900 font-mono">
                    {formatCurrency(log.actualCash)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold font-mono">
                    <span
                      className={
                        log.variance === 0
                          ? 'text-emerald-700'
                          : log.variance < 0
                          ? 'text-rose-600'
                          : 'text-indigo-600'
                      }
                    >
                      {log.variance === 0 ? '₱0.00' : (log.variance > 0 ? `+${formatCurrency(log.variance)}` : formatCurrency(log.variance))}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        log.status === 'balanced'
                          ? 'bg-emerald-100 text-emerald-800'
                          : log.status === 'shortage'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 max-w-xs truncate" title={log.notes}>
                    {log.notes}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleLoadPastAudit(log)}
                      className="text-xs font-bold text-[#4f46e5] hover:underline"
                    >
                      Load Data
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 9. View Slip / Receipt Modal ─────────────────────────────────────────── */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn no-print">
          <div className="bg-white rounded-[28px] max-w-md w-full p-6 shadow-xl border border-slate-100 relative space-y-4">
            <button
              type="button"
              onClick={() => setSelectedReceipt(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-xl bg-slate-50"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Receipt Thermal Header */}
            <div className="text-center pb-4 border-b border-dashed border-slate-200">
              <span className="text-[10px] uppercase tracking-widest font-black text-indigo-600">
                GLASSRAM SUPPLY INC.
              </span>
              <h3 className="text-lg font-black text-slate-900">Official Sales Slip</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Receipt Ref: <span className="font-mono text-slate-700 font-bold">{selectedReceipt.referenceNumber}</span>
              </p>
              <p className="text-[10px] text-slate-400">Date: {selectedReceipt.date}</p>
            </div>

            {/* Customer Details */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Customer:</span>
                <span className="font-bold text-slate-800">{selectedReceipt.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Contact:</span>
                <span className="font-medium text-slate-700">{selectedReceipt.contact}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Order Type:</span>
                <span className="font-bold uppercase text-indigo-600">{selectedReceipt.orderType}</span>
              </div>
            </div>

            {/* Itemized Line Items */}
            <div className="border-t border-b border-dashed border-slate-200 py-3 space-y-2">
              <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400">
                <span>Item Description</span>
                <span>Amount</span>
              </div>
              {selectedReceipt.items.map((it, idx) => (
                <div key={idx} className="flex justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{it.productName}</span>
                    <span className="text-slate-400 ml-1.5 text-[11px]">x{it.quantity} @ {formatCurrency(it.unitPrice)}</span>
                  </div>
                  <span className="font-black text-slate-900 font-mono">{formatCurrency(it.total)}</span>
                </div>
              ))}
            </div>

            {/* Financials Breakdown */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-sm">
                <span className="font-bold text-slate-600">Total Amount</span>
                <span className="font-black text-slate-900 font-mono">{formatCurrency(selectedReceipt.total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-bold text-emerald-700">Paid Amount</span>
                <span className="font-black text-emerald-700 font-mono">{formatCurrency(selectedReceipt.paidAmount)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Payment Status</span>
                <span className="font-extrabold uppercase text-slate-700">{selectedReceipt.paymentStatus}</span>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Slip</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 10. Dedicated Printable Z-Reading Sheet (Shown only when window.print is active) ── */}
      <div className="hidden print:block text-black p-8 font-sans space-y-6">
        <div className="text-center border-b-2 border-black pb-4">
          <h1 className="text-2xl font-black uppercase tracking-wider">GLASSRAM SUPPLY</h1>
          <p className="text-sm font-semibold">Architectural Glass &amp; Aluminum Profiles</p>
          <p className="text-xs mt-1 font-mono">Official End-of-Day Sales &amp; Cash Reconciliation (Z-Reading)</p>
        </div>

        <div className="flex justify-between text-xs border-b border-black pb-3 font-mono">
          <div>
            <p><strong>Audit Date:</strong> {selectedDate}</p>
            <p><strong>Generated At:</strong> {new Date().toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p><strong>Auditor / Cashier:</strong> {auditorName}</p>
            <p><strong>Register Status:</strong> {isBalanced ? 'BALANCED' : isShortage ? 'SHORTAGE' : 'OVERAGE'}</p>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="space-y-2 text-xs border-b border-black pb-4">
          <h2 className="font-black text-sm uppercase">1. Receipts &amp; Expected Cash</h2>
          <div className="flex justify-between">
            <span>Total Registered Gross Sales ({activeOrdersToday.length} receipts):</span>
            <span className="font-mono font-bold">{formatCurrency(grossSalesToday)}</span>
          </div>
          <div className="flex justify-between">
            <span>Beginning Register Float (Petty Cash):</span>
            <span className="font-mono font-bold">{formatCurrency(startingFloat)}</span>
          </div>
          <div className="flex justify-between">
            <span>Physical Cash Receipts Collected:</span>
            <span className="font-mono font-bold">{formatCurrency(totalCashReceipts)}</span>
          </div>
          <div className="flex justify-between">
            <span>Digital / GCash / Bank Transfers (Non-Drawer):</span>
            <span className="font-mono font-bold">{formatCurrency(totalDigitalReceipts)}</span>
          </div>
          <div className="flex justify-between">
            <span>Cash Refunds Paid Out:</span>
            <span className="font-mono font-bold">-{formatCurrency(totalRefundsToday)}</span>
          </div>
          <div className="flex justify-between text-sm font-black border-t border-black pt-1">
            <span>Expected Physical Cash in Drawer:</span>
            <span className="font-mono">{formatCurrency(expectedCashInDrawer)}</span>
          </div>
        </div>

        {/* Physical Cash Held */}
        <div className="space-y-2 text-xs border-b border-black pb-4">
          <h2 className="font-black text-sm uppercase">2. Physical Cash on Hand (Drawer Count)</h2>
          <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
            <div>₱1,000 × {denominations.d1000} = {formatCurrency(denominations.d1000 * 1000)}</div>
            <div>₱500 × {denominations.d500} = {formatCurrency(denominations.d500 * 500)}</div>
            <div>₱200 × {denominations.d200} = {formatCurrency(denominations.d200 * 200)}</div>
            <div>₱100 × {denominations.d100} = {formatCurrency(denominations.d100 * 100)}</div>
            <div>₱50 × {denominations.d50} = {formatCurrency(denominations.d50 * 50)}</div>
            <div>₱20 × {denominations.d20} = {formatCurrency(denominations.d20 * 20)}</div>
            <div>Coins / Change = {formatCurrency(denominations.d10 * 10 + denominations.d5 * 5 + denominations.d1 * 1 + denominations.coins)}</div>
          </div>
          <div className="flex justify-between text-sm font-black border-t border-black pt-1">
            <span>Total Actual Physical Cash Held:</span>
            <span className="font-mono">{formatCurrency(totalCountedCash)}</span>
          </div>
        </div>

        {/* Reconciliation Outcome */}
        <div className="space-y-1 text-xs border-b border-black pb-4">
          <h2 className="font-black text-sm uppercase">3. Discrepancy &amp; Reconciliation Outcome</h2>
          <div className="flex justify-between text-sm font-black">
            <span>Variance (Actual Cash - Expected Cash):</span>
            <span className="font-mono">
              {isBalanced ? '₱0.00 (EXACT MATCH)' : variance > 0 ? `+${formatCurrency(variance)} (OVERAGE)` : `${formatCurrency(variance)} (SHORTAGE)`}
            </span>
          </div>
          {auditNotes && (
            <p className="mt-2 text-xs italic">
              <strong>Notes:</strong> {auditNotes}
            </p>
          )}
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-12 pt-8 text-xs">
          <div className="text-center space-y-8">
            <div className="border-b border-black pb-1" />
            <p className="font-bold">Cashier / Auditor Signature</p>
          </div>
          <div className="text-center space-y-8">
            <div className="border-b border-black pb-1" />
            <p className="font-bold">Store / Branch Manager Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
};
