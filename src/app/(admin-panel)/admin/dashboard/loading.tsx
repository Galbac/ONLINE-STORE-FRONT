export default function AdminDashboardLoading() {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 animate-in fade-in duration-150">
      {/* Dashboard Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="h-7 w-56 rounded-xl bg-slate-200/80 animate-pulse" />
          <div className="h-4 w-80 rounded-lg bg-slate-100 animate-pulse" />
        </div>
        {/* Preset pill skeleton */}
        <div className="flex items-center gap-1.5 rounded-2xl bg-slate-100/80 p-1 border border-slate-200/60">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-7 w-16 rounded-xl bg-white/60 animate-pulse" />
          ))}
        </div>
      </div>

      {/* KPI Cards Grid Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-2xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 rounded bg-slate-100 animate-pulse" />
              <div className="size-9 rounded-xl bg-slate-100 animate-pulse" />
            </div>
            <div className="h-8 w-36 rounded-lg bg-slate-200/80 animate-pulse" />
            <div className="h-3.5 w-44 rounded bg-slate-100 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Charts Skeleton: 2 columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/70 bg-white p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="h-5 w-40 rounded bg-slate-200/80 animate-pulse" />
            <div className="h-4 w-20 rounded bg-slate-100 animate-pulse" />
          </div>
          <div className="h-64 w-full rounded-xl bg-slate-50 flex items-end gap-3 p-4">
            {[40, 65, 30, 80, 55, 90, 70, 85, 60, 95, 75, 50, 65, 80].map((h, i) => (
              <div
                key={i}
                style={{ height: `${h}%` }}
                className="flex-1 rounded-t-md bg-slate-200/70 animate-pulse"
              />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-2xs space-y-4">
          <div className="h-5 w-32 rounded bg-slate-200/80 animate-pulse border-b border-slate-100 pb-3" />
          <div className="flex justify-center py-6">
            <div className="size-44 rounded-full border-8 border-slate-100 border-t-emerald-200 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
