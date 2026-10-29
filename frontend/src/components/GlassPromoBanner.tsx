import React from 'react';
import { ArrowRight, BarChart3, Boxes, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const OperationsInsightsBanner: React.FC = () => {
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden rounded-[48px] p-8 lg:p-12 shadow-2xl text-white group bg-gradient-to-br from-indigo-600 to-indigo-900">
      <div className="absolute -left-20 -top-20 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute right-10 -bottom-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
        <div className="flex-1 space-y-4 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-indigo-100 text-[11px] font-bold tracking-wider uppercase">
            <Package className="w-3.5 h-3.5 text-amber-300" />
            <span>Inventory &amp; order insights</span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-[-0.02em] leading-tight text-white">
            Keep stock, sales, and deliveries in view
          </h2>

          <p className="text-sm sm:text-base text-indigo-100/90 leading-relaxed max-w-xl font-normal">
            Review inventory levels, completed orders, and configured reorder thresholds. Demand estimates are rule-based and appear only when the order history is sufficient.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/analytics')}
              className="px-7 py-3.5 rounded-2xl bg-white text-[#4f46e5] font-extrabold text-sm shadow-2xl shadow-indigo-950/40 hover:shadow-white/20 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2"
            >
              <span>View Analytics</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/inventory')}
              className="px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-sm backdrop-blur-sm transition-all duration-300"
            >
              Manage Inventory
            </button>
          </div>
        </div>

        <div className="w-full lg:w-[340px] flex-shrink-0 flex justify-center">
          <div className="w-full max-w-[320px] rounded-3xl p-5 border border-white/20 shadow-2xl bg-white/10 backdrop-blur-xl space-y-3">
            <div className="flex items-center gap-2 pb-3 border-b border-white/15">
              <BarChart3 className="w-4 h-4 text-indigo-200" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-100">What these insights use</span>
            </div>
            <div className="bg-white/10 rounded-2xl p-3 border border-white/15 flex items-start gap-3">
              <Boxes className="w-4 h-4 mt-0.5 text-emerald-300 shrink-0" />
              <div>
                <p className="font-bold text-sm text-white">Current inventory</p>
                <p className="text-[11px] text-indigo-100 mt-1">Stock quantities and reorder thresholds</p>
              </div>
            </div>
            <div className="bg-white/10 rounded-2xl p-3 border border-white/15 flex items-start gap-3">
              <BarChart3 className="w-4 h-4 mt-0.5 text-amber-300 shrink-0" />
              <div>
                <p className="font-bold text-sm text-white">Completed orders</p>
                <p className="text-[11px] text-indigo-100 mt-1">Used for demand estimates when enough history exists</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
