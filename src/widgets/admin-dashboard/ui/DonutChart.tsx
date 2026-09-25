import type { LucideIcon } from "lucide-react";
import { cn } from "@/shared/config";

export interface DonutChartItem {
  id: string;
  label: string;
  value: number;
  share_percent: number;
  color?: string;
}

interface DonutChartProps {
  title: string;
  icon: LucideIcon;
  items: DonutChartItem[];
  emptyTitle: string;
  emptyDescription: string;
  valueFormatter: (value: number) => string;
  badge?: React.ReactNode;
  className?: string;
}

const DEFAULT_COLORS = [
  "#10b981", // emerald-500
  "#0ea5e9", // sky-500
  "#8b5cf6", // violet-500
  "#f59e0b", // amber-500
  "#ec4899", // pink-500
  "#64748b", // slate-500
];

export const DonutChart = ({
  title,
  icon: Icon,
  items,
  emptyTitle,
  emptyDescription,
  valueFormatter,
  badge,
  className,
}: DonutChartProps) => {
  const validItems = items.filter((item) => item.value > 0 || item.share_percent > 0);
  const totalValue = validItems.reduce((acc, item) => acc + item.value, 0);

  // SVG circle calculations
  const radius = 38;
  const circumference = 2 * Math.PI * radius; // ~238.76

  let cumulativePercent = 0;

  return (
    <section className={cn("rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs", className)}>
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
        <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
          <Icon size={18} className="text-emerald-600" />
          <span>{title}</span>
        </h2>
        {badge}
      </div>

      {validItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-center gap-6">
          {/* SVG Donut */}
          <div className="relative flex items-center justify-center mx-auto">
            <svg viewBox="0 0 100 100" className="size-32 -rotate-90">
              {/* Background ring */}
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="fill-none stroke-slate-100"
                strokeWidth="11"
              />
              {/* Segments */}
              {validItems.map((item, idx) => {
                const color = item.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
                const percent = item.share_percent;
                const strokeDasharray = `${(percent / 100) * circumference} ${circumference}`;
                const strokeDashoffset = -((cumulativePercent / 100) * circumference);
                cumulativePercent += percent;

                return (
                  <circle
                    key={item.id}
                    cx="50"
                    cy="50"
                    r={radius}
                    className="fill-none transition-all duration-500 ease-out"
                    stroke={color}
                    strokeWidth="11"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                );
              })}
            </svg>
            {/* Center total */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Всего</span>
              <span className="text-xs font-black text-slate-900 tracking-tight max-w-[80px] truncate">
                {valueFormatter(totalValue)}
              </span>
            </div>
          </div>

          {/* Legend and breakdown list */}
          <div className="space-y-3">
            {validItems.map((item, idx) => {
              const color = item.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
              return (
                <div key={item.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-2 text-slate-700">
                      <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="truncate max-w-[140px]">{item.label}</span>
                    </span>
                    <span className="font-bold text-slate-900">{valueFormatter(item.value)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(item.share_percent, 100)}%`, backgroundColor: color }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 w-9 text-right font-mono">
                      {item.share_percent}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-7 text-center space-y-2.5">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <Icon size={22} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-700">{emptyTitle}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">{emptyDescription}</p>
          </div>
        </div>
      )}
    </section>
  );
};
