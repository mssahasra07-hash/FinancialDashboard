// src/components/DonutChart.tsx
import React from 'react';
import { CATEGORY_COLORS } from '../types/index.ts';

interface DonutChartProps {
  data: Record<string, number>;
  currency: string;
}

export const DonutChart: React.FC<DonutChartProps> = ({ data, currency }) => {
  const entries = Object.entries(data).filter(([_, amount]) => amount > 0);
  const total = entries.reduce((acc, [_, amount]) => acc + amount, 0);

  if (entries.length === 0 || total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-52 text-slate-400 text-xs">
        <p>No expenses recorded this month.</p>
      </div>
    );
  }

  // Calculate SVG arc paths or simple conic-gradient
  let cumulativeAngle = 0;
  const gradientStops = entries.map(([category, amount]) => {
    const sliceAngle = (amount / total) * 360;
    const start = cumulativeAngle;
    const end = cumulativeAngle + sliceAngle;
    cumulativeAngle = end;
    const color = CATEGORY_COLORS[category] || '#64748b';
    return `${color} ${start}deg ${end}deg`;
  });

  const backgroundConic = `conic-gradient(${gradientStops.join(', ')})`;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 justify-around py-2">
      {/* Donut graphic */}
      <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
        <div
          className="w-full h-full rounded-full shadow-inner"
          style={{ background: backgroundConic }}
        />
        <div className="absolute w-24 h-24 bg-white dark:bg-slate-900 rounded-full flex flex-col items-center justify-center shadow-xs transition-colors">
          <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Total</span>
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {currency}{total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 w-full max-w-xs text-xs">
        {entries.slice(0, 8).map(([cat, amt]) => {
          const pct = ((amt / total) * 100).toFixed(0);
          const color = CATEGORY_COLORS[cat] || '#64748b';
          return (
            <div key={cat} className="flex items-center gap-2 truncate">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <div className="truncate flex-1">
                <span className="text-slate-600 dark:text-slate-300 truncate block">{cat}</span>
                <span className="text-[11px] font-semibold text-slate-900 dark:text-white">
                  {currency}{amt.toFixed(0)} <span className="text-slate-400 dark:text-slate-500 font-normal">({pct}%)</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
