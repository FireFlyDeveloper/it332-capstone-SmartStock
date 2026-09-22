import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Glassmorphism Promo Banner
 * Spec:
 * - High-impact call-to-action banner with depth effects
 * - Background: linear-gradient(135deg, #4f46e5, #3730a3)
 * - Border-radius: 48px (rounded-[48px])
 * - Internal padding: 48px (p-8 lg:p-12)
 * - Right side features a floating 'glass' window using backdrop-filter: blur(12px) and white/10 opacity, tilted at 6 degrees
 * - Typography inside: White, Extra Bold
 * - CTA button: White background, #4f46e5 text, rounded-2xl, heavy shadow
 */
export const GlassPromoBanner: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      className="relative overflow-hidden rounded-[48px] p-8 lg:p-12 shadow-2xl text-white group"
      style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
      }}
    >
      {/* Subtle background glow elements */}
      <div className="absolute -left-20 -top-20 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute right-10 -bottom-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
        {/* Left Side: Typography & CTA */}
        <div className="flex-1 space-y-4 text-left">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-indigo-100 text-[11px] font-bold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>SmartStock AI Intelligence · Glassram</span>
          </div>

          {/* Heading: White, Extra Bold */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-[-0.02em] leading-tight text-white">
            Forecast Inventory &amp; Streamline Fleet Dispatch in Real-Time
          </h2>

          <p className="text-sm sm:text-base text-indigo-100/90 leading-relaxed max-w-xl font-normal">
            Integrated AI analyzes historical order velocity for float glass, tempered glass, and aluminum channels to recommend automatic reorders and avoid costly stockouts.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            {/* CTA Button: White background, #4f46e5 text, rounded-2xl, heavy shadow */}
            <button
              type="button"
              onClick={() => navigate('/analytics')}
              className="px-7 py-3.5 rounded-2xl bg-white text-[#4f46e5] font-extrabold text-sm shadow-2xl shadow-indigo-950/40 hover:shadow-white/20 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-2"
            >
              <span>Explore AI Forecasts</span>
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

        {/* Right Side: Floating 'glass' window tilted at 6 degrees */}
        <div className="w-full lg:w-[340px] flex-shrink-0 flex justify-center">
          <div
            className="w-full max-w-[320px] rounded-3xl p-5 border border-white/20 shadow-2xl transition-all duration-500 group-hover:rotate-2 group-hover:scale-[1.03]"
            style={{
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              backgroundColor: 'rgba(255, 255, 255, 0.10)',
              transform: 'rotate(6deg)',
            }}
          >
            {/* Window header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/15 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200 flex items-center gap-1">
                <Cpu className="w-3 h-3" /> DeepSeek V3
              </span>
            </div>

            {/* Content inside the glass window: Extra Bold Typography */}
            <div className="space-y-3">
              <div className="bg-white/10 rounded-2xl p-3 border border-white/15">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">
                    Reorder Prediction
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300">
                    Urgent
                  </span>
                </div>
                <p className="font-extrabold text-sm text-white mt-1">
                  Mirror 6mm &amp; DGU
                </p>
                <div className="flex items-center justify-between mt-2 text-[11px] text-indigo-100">
                  <span>Recommended: +24 units</span>
                  <span className="font-extrabold text-amber-300">Avoid ₱56k in lost sales</span>
                </div>
              </div>

              {/* Confidence badge */}
              <div className="flex items-center justify-between px-1 text-xs">
                <span className="text-indigo-200 flex items-center gap-1 text-[11px] font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" /> Model Confidence
                </span>
                <span className="font-extrabold text-emerald-300 text-sm">96.8%</span>
              </div>

              <div className="w-full bg-white/15 h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-400 to-teal-300 h-full w-[96.8%]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
