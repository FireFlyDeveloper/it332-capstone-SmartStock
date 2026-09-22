import React from 'react';
import { ShoppingBag, PackagePlus, Truck, FileSpreadsheet, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * QuickActionsGrid ('Actions Rapides')
 * Spec:
 * - 2x2 grid of square cards with large centered icons and bold labels
 * - Soft Professional borders (1px solid #f1f5f9) and soft shadows
 * - Micro-interaction: Subtle scale (1.02x) on card hover
 * - 300ms cubic-bezier transition
 */
export const QuickActionsGrid: React.FC = () => {
  const navigate = useNavigate();

  const actions = [
    {
      id: 'order',
      title: 'Nouvelle Commande',
      subtitle: 'Créer un bon de vente',
      icon: ShoppingBag,
      path: '/orders',
      iconBg: 'bg-indigo-50 text-[#4f46e5]',
      hoverBorder: 'hover:border-indigo-200',
    },
    {
      id: 'product',
      title: 'Ajouter Matériau',
      subtitle: 'Verre ou aluminium',
      icon: PackagePlus,
      path: '/inventory',
      iconBg: 'bg-emerald-50 text-[#10b981]',
      hoverBorder: 'hover:border-emerald-200',
    },
    {
      id: 'dispatch',
      title: 'Suivi Tournées',
      subtitle: 'Flotte de camions',
      icon: Truck,
      path: '/delivery',
      iconBg: 'bg-amber-50 text-[#f59e0b]',
      hoverBorder: 'hover:border-amber-200',
    },
    {
      id: 'report',
      title: 'Exporter Rapport',
      subtitle: 'Bilan & synthèse PDF',
      icon: FileSpreadsheet,
      path: '/reports',
      iconBg: 'bg-blue-50 text-[#3b82f6]',
      hoverBorder: 'hover:border-blue-200',
    },
  ];

  return (
    <div className="bg-white rounded-[40px] p-6 sm:p-8 border border-[#f1f5f9] shadow-[0_4px_6px_-1px_rgb(0_0_0/0.05)] h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
            RACCOURCIS
          </span>
          <h3 className="text-lg font-extrabold text-slate-900 tracking-[-0.02em]">
            Actions Rapides
          </h3>
        </div>
      </div>

      {/* 2x2 Grid of square cards */}
      <div className="grid grid-cols-2 gap-3.5 flex-1">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              type="button"
              onClick={() => navigate(act.path)}
              className={`
                group relative flex flex-col items-center justify-center text-center
                p-4 rounded-2xl border border-slate-100 bg-[#f8fafc]/60
                hover:bg-white hover:shadow-md ${act.hoverBorder}
                transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
                hover:scale-[1.02] cursor-pointer
              `}
            >
              {/* Corner arrow icon */}
              <ArrowUpRight className="absolute top-2.5 right-2.5 w-3.5 h-3.5 text-slate-300 group-hover:text-slate-700 transition-colors" />

              {/* Large Centered Icon in colored background box (12px radius) */}
              <div
                className={`w-12 h-12 rounded-[12px] ${act.iconBg} flex items-center justify-center mb-2.5 shadow-2xs group-hover:scale-110 transition-transform duration-300`}
              >
                <Icon className="w-6 h-6" />
              </div>

              {/* Bold Label */}
              <span className="font-extrabold text-xs text-slate-800 group-hover:text-indigo-600 transition-colors leading-tight">
                {act.title}
              </span>
              <span className="text-[10px] text-slate-400 font-medium mt-0.5">
                {act.subtitle}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
