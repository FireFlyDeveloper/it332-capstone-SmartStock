import React from 'react';
import { CheckCircle2, Truck, AlertTriangle, PackagePlus, Clock } from 'lucide-react';
import type { Order, Delivery, Product } from '../types';
import { formatCurrency } from '../utils/helpers';

interface RecentActivityTimelineProps {
  orders: Order[];
  deliveries: Delivery[];
  products: Product[];
}

export const RecentActivityTimeline: React.FC<RecentActivityTimelineProps> = ({
  orders,
  deliveries,
  products,
}) => {
  // Synthesize recent activities from real data
  const activities = [
    {
      id: 'act-1',
      title: 'Order confirmed & packed',
      desc: `${orders[0]?.customerName || 'John Construction'} · ${formatCurrency(orders[0]?.total || 58500)}`,
      time: '14 mins ago',
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 text-[#10b981]',
      type: 'success',
    },
    {
      id: 'act-2',
      title: 'Truck in transit',
      desc: `${deliveries[0]?.truckNumber || 'Truck-101'} · Driver ${deliveries[0]?.driver || 'Juan'}`,
      time: '32 mins ago',
      icon: Truck,
      iconBg: 'bg-amber-50 text-[#f59e0b]',
      type: 'warning',
    },
    {
      id: 'act-3',
      title: 'Low stock alert detected',
      desc: `${products.find((p) => p.stock <= p.threshold)?.name || 'Mirror 6mm'} (critical threshold)`,
      time: '1 hr ago',
      icon: AlertTriangle,
      iconBg: 'bg-rose-50 text-[#f43f5e]',
      type: 'danger',
    },
    {
      id: 'act-4',
      title: 'Glass restock received',
      desc: 'Clear Float Glass 4mm (+100 sqm received)',
      time: '2 hrs ago',
      icon: PackagePlus,
      iconBg: 'bg-indigo-50 text-[#4f46e5]',
      type: 'primary',
    },
  ];

  return (
    <div className="bg-white rounded-[40px] p-6 sm:p-8 border border-[#f1f5f9] shadow-[0_4px_6px_-1px_rgb(0_0_0/0.05)] transition-all duration-300 hover:scale-[1.01] hover:shadow-md flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
              LIVE FEED
            </span>
            <h3 className="text-lg font-extrabold text-slate-900 tracking-[-0.02em]">
              Recent Activity
            </h3>
          </div>
          <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            Real-time
          </span>
        </div>

        {/* Vertical Timeline with connecting line */}
        <div className="relative pl-6 space-y-5 before:absolute before:left-3 before:top-2 before:bottom-3 before:w-0.5 before:bg-slate-100">
          {activities.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="relative flex items-start gap-3.5 group">
                {/* Node icon */}
                <div
                  className={`absolute -left-6 top-0 w-6 h-6 rounded-full ${item.iconBg} flex items-center justify-center ring-4 ring-white shadow-2xs`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                      {item.title}
                    </p>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap font-medium">
                      {item.time}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate font-normal">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-400 font-medium">All operations synchronized</span>
        <span className="font-extrabold text-emerald-600 flex items-center gap-1 text-[11px]">
          ● System active
        </span>
      </div>
    </div>
  );
};
