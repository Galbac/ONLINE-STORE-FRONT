export default function AdminGlobalLoading() {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 animate-in fade-in duration-150">
      {/* Top Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-xl bg-slate-200/80 animate-pulse" />
          <div className="h-4 w-72 rounded-lg bg-slate-100 animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-28 rounded-xl bg-slate-100 animate-pulse" />
          <div className="h-9 w-32 rounded-xl bg-slate-200/80 animate-pulse" />
        </div>
      </div>

      {/* KPI Stats Grid Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-2xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 rounded bg-slate-100 animate-pulse" />
              <div className="size-8 rounded-xl bg-slate-100 animate-pulse" />
            </div>
            <div className="h-7 w-32 rounded-lg bg-slate-200/80 animate-pulse" />
            <div className="h-3 w-40 rounded bg-slate-100 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Main Content / Table Area Skeleton */}
      <div className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="h-5 w-36 rounded bg-slate-200/70 animate-pulse" />
          <div className="h-8 w-24 rounded-lg bg-slate-100 animate-pulse" />
        </div>
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center justify-between gap-4 py-2 border-b border-slate-50 last:border-0">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-slate-100 animate-pulse shrink-0" />
                <div className="space-y-1.5">
                  <div className="h-4 w-44 rounded bg-slate-200/70 animate-pulse" />
                  <div className="h-3 w-28 rounded bg-slate-100 animate-pulse" />
                </div>
              </div>
              <div className="h-4 w-20 rounded bg-slate-100 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
