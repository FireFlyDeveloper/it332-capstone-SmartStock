import React from 'react';
import { AlertCircle, ClipboardList, PackageMinus, PackagePlus } from 'lucide-react';
import type { DashboardActivityRecord } from '../api';
import { formatCurrency } from '../utils/helpers';

interface RecentActivityTimelineProps {
  activities: DashboardActivityRecord[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

function formatActivityTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Timestamp unavailable';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function displayStatus(status: string): string {
  return status.replaceAll('_', ' ');
}

export const RecentActivityTimeline: React.FC<RecentActivityTimelineProps> = ({
  activities,
  loading,
  error,
  onRetry,
}) => (
  <div className="bg-white rounded-[40px] p-6 sm:p-8 border border-[#f1f5f9] shadow-[0_4px_6px_-1px_rgb(0_0_0/0.05)] transition-all duration-300 hover:scale-[1.01] hover:shadow-md flex flex-col h-full">
    <div className="flex items-center justify-between mb-5">
      <div>
        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
          RECENT UPDATES
        </span>
        <h3 className="text-lg font-extrabold text-slate-900 tracking-[-0.02em]">
          Recent Activity
        </h3>
      </div>
    </div>

    {loading ? (
      <div role="status" className="py-8 text-center text-sm text-slate-500">
        Loading activity…
      </div>
    ) : error ? (
      <div role="alert" className="flex flex-col items-center gap-3 py-6 text-center">
        <AlertCircle className="h-5 w-5 text-rose-500" aria-hidden="true" />
        <p className="text-sm text-rose-700">Could not load activity: {error}</p>
        <button type="button" onClick={onRetry} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">
          Retry
        </button>
      </div>
    ) : activities.length === 0 ? (
      <p className="py-8 text-center text-sm text-slate-500">No recent activity.</p>
    ) : (
      <div className="space-y-5">
        {activities.map((activity) => {
          const isOrder = activity.kind === 'order_recorded';
          const isInbound = activity.movementType === 'inbound';
          const Icon = isOrder ? ClipboardList : isInbound ? PackagePlus : PackageMinus;
          const iconClass = isOrder
            ? 'bg-blue-50 text-blue-600'
            : isInbound
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-amber-50 text-amber-600';
          const title = isOrder
            ? 'Order recorded'
            : isInbound
              ? 'Stock received'
              : 'Stock issued';
          const detail = isOrder
            ? [activity.referenceNumber, activity.customerName, activity.orderStatus && `Status: ${displayStatus(activity.orderStatus)}`]
                .filter(Boolean)
                .join(' · ')
            : [activity.productName ?? activity.productId, activity.quantity !== undefined && `${activity.quantity}${activity.unit ? ` ${activity.unit}` : ''}`, `Ref ${activity.referenceNumber}`]
                .filter(Boolean)
                .join(' · ');
          return (
            <div key={activity.id} className="flex items-start gap-3.5">
              <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${iconClass}`}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-xs font-bold text-slate-800">{title}</p>
                  <time dateTime={activity.occurredAt} className="shrink-0 whitespace-nowrap text-[10px] font-medium text-slate-400">
                    {formatActivityTime(activity.occurredAt)}
                  </time>
                </div>
                <p className="mt-0.5 truncate text-[11px] text-slate-500">{detail}</p>
                {isOrder && activity.orderTotal !== undefined && (
                  <p className="mt-1 text-[11px] font-semibold text-slate-600">Order total: {formatCurrency(activity.orderTotal)}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    )}

    <div className="mt-auto pt-4 border-t border-slate-100 text-[11px] text-slate-400">
      Activity comes from recorded orders and stock movements.
    </div>
  </div>
);
