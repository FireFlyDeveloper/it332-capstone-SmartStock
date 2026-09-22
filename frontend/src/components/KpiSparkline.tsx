import React from 'react';

interface KpiSparklineProps {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}

/**
 * KPI Sparkline component
 * Spec:
 * - SVG path with stroke-linecap: round and stroke-linejoin: round
 * - Stroke-width: 2px
 * - Fill: none
 * - Height: 40px
 * - Smoothly interpolates between 7-10 data points across the card width.
 */
export const KpiSparkline: React.FC<KpiSparklineProps> = ({
  data,
  color,
  width = 240,
  height = 40,
}) => {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const paddingY = 6;
  const usableHeight = height - paddingY * 2;

  // Compute (x, y) coordinates for points
  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - paddingY - ((val - min) / range) * usableHeight;
    return { x, y };
  });

  // Build smooth cubic bezier curve
  // Using Catmull-Rom or standard cubic bezier control points
  let pathD = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];

    // Control point 1
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;

    // Control point 2
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    pathD += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  // Subtle gradient id based on color
  const gradientId = `spark-grad-${Math.abs(color.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0))}`;

  return (
    <div className="w-full h-[36px] overflow-hidden">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full overflow-hidden block"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.15" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Subtle area fill underneath the curve */}
        <path
          d={`${pathD} L ${width} ${height} L 0 ${height} Z`}
          fill={`url(#${gradientId})`}
        />

        {/* Spec: Stroke 2px, stroke-linecap: round, stroke-linejoin: round, fill: none */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
