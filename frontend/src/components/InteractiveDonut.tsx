import React, { useState } from 'react';

export interface DonutSegment {
  label: string;
  shortLabel?: string;
  value: number;
  color: string;
  percentage?: number;
}

interface InteractiveDonutProps {
  data: DonutSegment[];
  totalLabel?: string;
  customTotal?: string | number;
  size?: number;
}

/**
 * Interactive Donut Chart
 * Spec:
 * - Custom SVG donut with centered metrics
 * - Central hole size: 70%
 * - Stroke-width: 4-6px
 * - Colors: emerald-500, amber-500, etc.
 * - Center content: Large number (3xl) and small 'Total' label (10px uppercase)
 * - Legend below: Dot indicators, flex-between layout, font-size 11px, bold weights for values.
 */
export const InteractiveDonut: React.FC<InteractiveDonutProps> = ({
  data,
  totalLabel = 'TOTAL',
  customTotal,
  size = 180,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = data.reduce((acc, seg) => acc + seg.value, 0);

  // SVG Geometry
  // For size 180, center is (90, 90).
  // Central hole 70%: outer radius = 75, inner hole = 70% of 150 = 105 diameter (r=52.5).
  // Center line radius = (75 + 52.5) / 2 = 63.75, stroke width = 22.5.
  // Or viewBox 100 100, radius 38, stroke 12 => hole = (38 - 6)/(38 + 6) ≈ 72% hole size.
  // When stroke-width is 5-6px:
  // Center is (90, 90), radius = 60, stroke = 6px gives a clean modern ring.
  const center = size / 2;
  const strokeWidth = 8; // Clean elegant stroke
  const radius = center - strokeWidth - 6;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  const segmentsWithAngles = data.map((seg) => {
    const percent = total > 0 ? seg.value / total : 0;
    const strokeDasharray = `${(percent * circumference).toFixed(2)} ${(
      circumference * (1 - percent)
    ).toFixed(2)}`;
    const strokeDashoffset = (-accumulatedPercent * circumference).toFixed(2);
    accumulatedPercent += percent;

    return {
      ...seg,
      percent: Math.round(percent * 100),
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const displayTotal = customTotal !== undefined ? customTotal : total;
  const currentHovered = hoveredIndex !== null ? segmentsWithAngles[hoveredIndex] : null;

  return (
    <div className="flex flex-col items-center w-full">
      {/* SVG Donut */}
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* Background circle track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />

          {/* Data Segments */}
          {segmentsWithAngles.map((seg, idx) => {
            const isHovered = hoveredIndex === idx;
            return (
              <circle
                key={seg.label}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                strokeDasharray={seg.strokeDasharray}
                strokeDashoffset={seg.strokeDashoffset}
                strokeLinecap="round"
                className="cursor-pointer transition-all duration-300"
                style={{
                  filter: isHovered ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))' : 'none',
                  opacity: hoveredIndex !== null && !isHovered ? 0.6 : 1,
                }}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}
        </svg>

        {/* Center content: Constrained width, large number (3xl) and concise label */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
          <div className="flex flex-col items-center justify-center text-center max-w-[105px] w-full">
            <span
              className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate max-w-full leading-tight"
              title={currentHovered ? currentHovered.label : totalLabel}
            >
              {currentHovered ? (currentHovered.shortLabel || currentHovered.label) : totalLabel}
            </span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none mt-1">
              {currentHovered ? `${currentHovered.percent}%` : (typeof displayTotal === 'number' ? displayTotal.toLocaleString() : displayTotal)}
            </span>
            {currentHovered && (
              <span className="text-[10px] font-semibold text-slate-400 leading-tight mt-1 truncate max-w-full">
                {currentHovered.value.toLocaleString()} items
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Legend below: Dot indicators, flex-between layout, font-size 11px, bold weights for values */}
      <div className="w-full mt-5 space-y-2">
        {segmentsWithAngles.map((seg, idx) => {
          const isHovered = hoveredIndex === idx;
          return (
            <div
              key={seg.label}
              className={`flex items-center justify-between text-[11px] py-1 px-2 rounded-xl transition-all cursor-pointer ${
                isHovered ? 'bg-slate-50' : 'hover:bg-slate-50/60'
              }`}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="text-slate-600 truncate font-medium">{seg.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">{seg.value.toLocaleString()}</span>
                <span className="text-slate-400 text-[10px] w-7 text-right">
                  {seg.percent}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
