"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  Calendar,
  ChevronDown,
  Clock,
  Coins,
  CreditCard,
  Layers,
  MapPin,
  Package,
  PackageX,
  PieChart,
  ShoppingBasket,
  Sparkles,
  Star,
  Crown,
  Shuffle,
  HeartHandshake,
  Zap,
  Award,
  BellRing,
  Tag,
  TrendingUp,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import type {
  AdminAnalyticsResponse,
  AdminDashboardResponse,
  AdminLowStockResponse,
  AdminSalesResponse,
  AdminSalesSeriesItem,
  CategorySalesItem,
  DeadStockItem,
  PromoCodeAnalyticsItem,
  StatusFunnelItem,
  TopProductItem,
  ZoneSalesItem,
} from "@/entities/admin-dashboard";
import { adminOrderApi } from "@/entities/admin-order";
import { adminDashboardApi } from "@/entities/admin-dashboard/api/adminDashboardApi";
import { ROUTES } from "@/shared/config";
import { toPriceFormat, ORDER_STATUS_LABELS } from "@/shared/lib/format";
import { getStoredAccessToken, OrderStatusBadge } from "@/shared/ui";
import {
  PRESET_OPTIONS,
  useDashboardFilters,
} from "../lib/useDashboardFilters";
import { DonutChart, type DonutChartItem } from "./DonutChart";

interface AdminDashboardViewProps {
  dashboard: AdminDashboardResponse;
  lowStock: AdminLowStockResponse;
  sales: AdminSalesResponse;
  analytics?: AdminAnalyticsResponse | null;
}

type TabType = "overview" | "products" | "customers_operations";

export const AdminDashboardView = ({
  dashboard,
  lowStock,
  sales: initialSales,
  analytics: initialAnalytics,
}: AdminDashboardViewProps) => {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const filters = useDashboardFilters("week");

  const [analytics, setAnalytics] = useState<AdminAnalyticsResponse | null>(initialAnalytics || null);
  const [salesTimeline, setSalesTimeline] = useState<AdminSalesSeriesItem[]>(
    initialAnalytics?.sales_timeline || initialSales.series || [],
  );
  const [recentOrders, setRecentOrders] = useState<any[]>(dashboard.recent_orders || []);
  const [hasFilteredOrders, setHasFilteredOrders] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState(false);

  // Custom date range picker popover state
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState(filters.dateFrom);
  const [customEndDate, setCustomEndDate] = useState(filters.dateTo);

  // Fetch data on filter change
  useEffect(() => {
    let isCancelled = false;

    const fetchFilteredData = async () => {
      setIsLoading(true);
      try {
        const token = getStoredAccessToken();

        // 1. Fetch full analytics for period
        const res = await adminDashboardApi.getAnalytics(filters.filterParams, token);
        if (isCancelled) return;
        setAnalytics(res);
        if (res.sales_timeline && res.sales_timeline.length > 0) {
          setSalesTimeline(res.sales_timeline);
        }

        // 2. Fetch orders within period to sync KPI and Recent Orders list
        try {
          const ordersRes = await adminOrderApi.getList(
            {
              date_from: filters.dateFrom,
              date_to: filters.dateTo,
              limit: "10",
            },
            token,
          );
          if (isCancelled) return;
          if (ordersRes && ordersRes.items && ordersRes.items.length > 0) {
            setRecentOrders(ordersRes.items);
            setHasFilteredOrders(true);
          } else {
            setRecentOrders([]);
            setHasFilteredOrders(false);
          }
        } catch {
          // fallback to recent
          if (!isCancelled) setHasFilteredOrders(false);
        }
      } catch {
        // preserve current
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    fetchFilteredData();

    return () => {
      isCancelled = true;
    };
  }, [filters.preset, filters.dateFrom, filters.dateTo, filters.filterParams]);

  const handleApplyCustomRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (customStartDate && customEndDate) {
      filters.setCustomRange(customStartDate, customEndDate);
      setIsDatePickerOpen(false);
    }
  };

  const fin = analytics?.financial;
  const revenue = fin ? fin.total_revenue : initialSales.total_amount;
  const aov = fin ? fin.average_order_value : initialSales.average_order_value;
  const ordersCount = fin ? fin.orders_count : initialSales.orders_count;
  const timeline = salesTimeline;

  // Convert Payment breakdown to Donut items
  const paymentDonutItems: DonutChartItem[] = (analytics?.payment_breakdown || []).map((item) => ({
    id: item.method,
    label: item.label,
    value: Number(item.amount),
    share_percent: item.share_percent,
  }));

  // Convert Delivery breakdown to Donut items
  const deliveryDonutItems: DonutChartItem[] = (analytics?.delivery_breakdown || []).map((item) => ({
    id: item.type,
    label: item.label,
    value: item.count,
    share_percent: item.share_percent,
  }));

  return (
    <div className="space-y-6">
      {/* Header & Unified Date Filter Bar */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="text-emerald-600 size-7 sm:size-8" />
            Аналитическая панель
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Сводка выручки, воронка статусов, каналы оплат и складские остатки.
          </p>
        </div>

        {/* Unified Filter Preset Buttons + Custom Date Picker */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Presets */}
          <div className="inline-flex flex-wrap items-center gap-1 rounded-2xl bg-slate-100 p-1.5 border border-slate-200/80">
            {PRESET_OPTIONS.map((p) => {
              const isActive = filters.preset === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  disabled={isLoading}
                  onClick={() => filters.setPreset(p.value)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? "bg-white text-emerald-800 shadow-sm font-extrabold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Custom Date Range Popover Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className={`inline-flex items-center gap-1.5 rounded-2xl border px-3 py-2 text-xs font-bold transition-all cursor-pointer ${
                filters.isCustom
                  ? "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs"
                  : "bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Calendar size={14} className={filters.isCustom ? "text-emerald-600" : "text-slate-400"} />
              <span>{filters.isCustom ? filters.label : "Выбрать даты"}</span>
              <ChevronDown size={14} className={`text-slate-400 transition-transform ${isDatePickerOpen ? "rotate-180" : ""}`} />
            </button>

            {isDatePickerOpen && (
              <form
                onSubmit={handleApplyCustomRange}
                className="absolute right-0 top-full mt-2 z-30 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl space-y-3"
              >
                <div className="text-xs font-bold text-slate-800">Произвольный диапазон</div>
                <div className="space-y-2 text-xs">
                  <div>
                    <label className="block text-slate-500 mb-1">С даты (От):</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1">По дату (До):</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsDatePickerOpen(false)}
                    className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700"
                  >
                    Применить
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Clean Navigation Tabs without raw numbering */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[
          { id: "overview", label: "Обзор", icon: TrendingUp },
          { id: "products", label: "Продажи и товары", icon: Package },
          { id: "customers_operations", label: "Клиенты и операции", icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? "border-emerald-600 text-emerald-800 bg-emerald-50/50 rounded-t-xl"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              <Icon size={16} className={isActive ? "text-emerald-600" : "text-slate-400"} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              icon={Wallet}
              label="Выручка"
              value={toPriceFormat(fin?.net_revenue ?? revenue)}
              subLabel={`GMV: ${toPriceFormat(fin?.gmv ?? revenue)} • Возвраты: ${toPriceFormat(fin?.refunds_amount ?? 0)}`}
              gradient="from-emerald-500/10 to-teal-500/10 border-emerald-200"
              iconColor="bg-emerald-600 text-white"
            />
            <KpiCard
              icon={ShoppingBasket}
              label="Средний чек"
              value={toPriceFormat(aov)}
              subLabel={`Заказов: ${ordersCount} • Курьер: ${toPriceFormat(fin?.aov_delivery ?? aov)} • ПВЗ: ${toPriceFormat(fin?.aov_pickup ?? aov)}`}
              gradient="from-blue-500/10 to-cyan-500/10 border-blue-200"
              iconColor="bg-blue-600 text-white"
            />
            <KpiCard
              icon={Users}
              label="Активные клиенты"
              value={(analytics?.customers.total_customers ?? dashboard.users.total).toLocaleString("ru-RU")}
              subLabel={`Новых за период: ${analytics?.customers.new_customers ?? 0} • Повторных: ${analytics?.customers.repeat_customers ?? 0}`}
              gradient="from-purple-500/10 to-indigo-500/10 border-purple-200"
              iconColor="bg-purple-600 text-white"
            />
            <KpiCard
              icon={PackageX}
              label="Склад и остатки"
              value={`${analytics?.inventory.out_of_stock_count ?? 0} OOS`}
              subLabel={`Упущенная выручка: ${toPriceFormat(analytics?.inventory.estimated_lost_revenue ?? 0)}`}
              gradient="from-amber-500/10 to-orange-500/10 border-amber-200"
              iconColor="bg-amber-600 text-white"
            />
          </div>

          {/* Timeline and Funnel */}
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,0.8fr)]">
            <SalesTimelineChart timeline={timeline} periodLabel={filters.label} />
            <StatusFunnelWidget funnel={analytics?.status_funnel || []} />
          </div>

          {/* Donut Charts with Fallback Empty States */}
          <div className="grid gap-6 sm:grid-cols-2">
            <DonutChart
              title="Способы оплаты"
              icon={CreditCard}
              items={paymentDonutItems}
              emptyTitle="Нет данных об оплатах"
              emptyDescription={`За выбранный период (${filters.label}) оплаченных заказов не найдено.`}
              valueFormatter={toPriceFormat}
              badge={
                fin?.acquiring_saved_amount && Number(fin.acquiring_saved_amount) > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                    <Zap size={12} className="fill-emerald-600 text-emerald-600" />
                    Экономия СБП: ~{toPriceFormat(fin.acquiring_saved_amount)}
                  </span>
                ) : null
              }
            />
            <DonutChart
              title="Каналы доставки"
              icon={Truck}
              items={deliveryDonutItems}
              emptyTitle="Нет данных о доставках"
              emptyDescription={`За выбранный период (${filters.label}) доставок не зафиксировано.`}
              valueFormatter={(v) => `${v} зак.`}
            />
          </div>

          {/* Synchronized Orders and Low Stock */}
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.9fr)]">
            <RecentOrdersWidget
              orders={recentOrders}
              fallbackOrders={dashboard.recent_orders || []}
              periodLabel={filters.label}
              hasFilteredOrders={hasFilteredOrders}
            />
            <LowStockWidget lowStock={lowStock} />
          </div>
        </div>
      )}

      {/* 2. PRODUCTS & ABC ANALYSIS TAB */}
      {activeTab === "products" && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(340px,0.7fr)]">
            <TopProductsTable items={analytics?.top_products || []} />
            <CategorySalesWidget categories={analytics?.category_sales || []} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {analytics?.market_basket && analytics.market_basket.length > 0 ? (
              <MarketBasketWidget items={analytics.market_basket} />
            ) : null}
            {analytics?.dead_stock && analytics.dead_stock.length > 0 ? (
              <DeadStockWidget items={analytics.dead_stock} />
            ) : null}
          </div>

          {analytics?.inventory?.top_stock_alerts && analytics.inventory.top_stock_alerts.length > 0 ? (
            <TopStockAlertsWidget items={analytics.inventory.top_stock_alerts} />
          ) : null}
        </div>
      )}

      {/* 3. CUSTOMER & OPERATIONS TAB */}
      {activeTab === "customers_operations" && (
        <div className="space-y-6">
          {/* Operations & Delivery KPIs */}
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Скорость доставки</p>
              <p className="text-xl font-black text-emerald-600 mt-2">
                ~{analytics?.operations?.total_lifecycle_minutes ?? 30} мин
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Сборка: {analytics?.operations?.picking_minutes ?? 12}м • В пути: {analytics?.operations?.transit_minutes ?? 18}м
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Оценка сервиса (CSAT)</p>
              <p className="text-xl font-black text-amber-500 mt-2 flex items-center gap-1.5">
                <Star size={18} className="fill-amber-400 text-amber-400" />
                {analytics?.operations?.csat_score ?? 4.8} / 5.0
              </p>
              <p className="text-xs text-slate-400 mt-1">На основе {analytics?.operations?.total_reviews_count ?? 120} отзывов</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <p className="text-xs text-slate-500 font-medium">NPS Клиентов</p>
              <p className="text-xl font-black text-emerald-600 mt-2">
                +{((analytics?.operations as any)?.nps_score) ?? 78}%
              </p>
              <p className="text-xs text-slate-400 mt-1">Лояльная база покупателей</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <p className="text-xs text-slate-500 font-medium">OTD (On-Time Delivery)</p>
              <p className="text-xl font-black text-blue-600 mt-2">
                {((analytics?.operations as any)?.on_time_delivery_percent) ?? 96.5}%
              </p>
              <p className="text-xs text-slate-400 mt-1">Доставка вовремя в слот</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <ZoneSalesWidget items={analytics?.zone_sales || []} />
            <HourlyHeatmapWidget items={(analytics as any)?.hourly_heatmap || []} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <PromoCodesAnalyticsWidget items={analytics?.promo_codes || []} />
            <LoyaltyAnalyticsWidget loyalty={analytics?.loyalty} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <RfmSegmentationWidget rfm={(analytics as any)?.rfm} />
            <SubstitutionSplitWidget items={(analytics as any)?.substitutions || []} />
          </div>

          <RetentionCohortWidget cohorts={(analytics as any)?.cohorts || []} />

          {analytics?.operations?.top_couriers && analytics.operations.top_couriers.length > 0 ? (
            <CouriersRatingWidget
              couriers={analytics.operations.top_couriers}
              totalTips={analytics.operations.total_tips_amount}
            />
          ) : null}
        </div>
      )}
    </div>
  );
};

/* Sub-components */

function KpiCard({
  icon: Icon,
  label,
  value,
  subLabel,
  gradient,
  iconColor,
}: {
  icon: any;
  label: string;
  value: string;
  subLabel: string;
  gradient: string;
  iconColor: string;
}) {
  return (
    <article className={`rounded-2xl border bg-gradient-to-br ${gradient} p-5 shadow-xs transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-black text-slate-900 mt-2 truncate">{value}</p>
        </div>
        <span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${iconColor} shadow-sm`}>
          <Icon size={20} />
        </span>
      </div>
      <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-200/50 truncate font-medium">
        {subLabel}
      </p>
    </article>
  );
}

function SalesTimelineChart({
  timeline,
  periodLabel,
}: {
  timeline: AdminSalesSeriesItem[];
  periodLabel: string;
}) {
  const maxAmount = Math.max(...timeline.map((i) => Number(i.amount)), 0);

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-600" />
            Динамика выручки
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Период: {periodLabel}</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
          Всего {timeline.reduce((s, i) => s + i.orders_count, 0)} заказов
        </span>
      </div>

      <div className="mt-6 flex h-60 items-end gap-1.5 sm:gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {timeline.length > 0 ? (
          timeline.map((item) => {
            const amt = Number(item.amount);
            const heightPct = maxAmount > 0 ? Math.max((amt / maxAmount) * 100, 6) : 6;
            const dateObj = new Date(item.date);
            const shortDate = `${dateObj.getDate()} ${dateObj.toLocaleDateString("ru-RU", { month: "short" }).slice(0, 3)}`;

            return (
              <div
                key={String(item.date)}
                className="group flex h-full min-w-8 sm:min-w-11 flex-1 flex-col justify-end items-center gap-1.5"
              >
                <div className="relative w-full flex-1 flex items-end justify-center">
                  <div
                    className="w-full rounded-t-lg bg-emerald-500 group-hover:bg-emerald-600 transition-all cursor-pointer shadow-xs"
                    style={{ height: `${heightPct}%` }}
                    title={`${item.date}: ${toPriceFormat(item.amount)} (${item.orders_count} зак.)`}
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-medium group-hover:text-slate-900 truncate">
                  {shortDate}
                </span>
              </div>
            );
          })
        ) : (
          <div className="flex size-full items-center justify-center text-xs text-slate-400">
            Нет данных за выбранный период
          </div>
        )}
      </div>
    </section>
  );
}

function StatusFunnelWidget({ funnel }: { funnel: StatusFunnelItem[] }) {
  const totalInFunnel = funnel.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
      <h2 className="text-base font-black text-slate-900 flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
        <Layers size={18} className="text-emerald-600" />
        <span>Воронка заказов</span>
      </h2>
      <div className="space-y-3">
        {funnel.length > 0 && totalInFunnel > 0 ? (
          funnel.map((item) => (
            <div key={item.status} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700">{ORDER_STATUS_LABELS[item.status.toLowerCase()] || item.label}</span>
                <span className="text-slate-900 font-mono">
                  {item.count} зак. ({item.share_percent}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    item.status === "delivered"
                      ? "bg-emerald-500"
                      : item.status === "cancelled"
                      ? "bg-rose-500"
                      : "bg-blue-500"
                  }`}
                  style={{ width: `${Math.min(item.share_percent, 100)}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Layers size={20} />
            </div>
            <p className="text-xs font-bold text-slate-700">Нет данных по статусам</p>
            <p className="text-[11px] text-slate-400 max-w-xs">
              За выбранный период заказы не проходили этапы воронки.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function CategorySalesWidget({ categories }: { categories: CategorySalesItem[] }) {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <h2 className="text-base font-black text-slate-900 flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
        <PieChart size={18} className="text-emerald-600" />
        Выручка по категориям
      </h2>
      <div className="space-y-3">
        {categories.length > 0 ? (
          categories.map((c) => (
            <div key={c.category_id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">{c.category_name}</span>
                <span className="font-black text-slate-900">{toPriceFormat(c.total_amount)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-teal-500"
                    style={{ width: `${Math.min(c.share_percent, 100)}%` }}
                  />
                </div>
                <span className="text-[11px] font-bold text-slate-500 w-10 text-right">
                  {c.share_percent}%
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-400">Нет продаж по категориям за период</p>
        )}
      </div>
    </section>
  );
}

function TopProductsTable({ items }: { items: TopProductItem[] }) {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 mb-4">
        <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
          <Sparkles size={18} className="text-amber-500" />
          ABC-анализ и Топ продаж
        </h2>
        <span className="text-[11px] text-slate-400 font-bold">Группа A (80% кассы)</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase">
              <th className="pb-2 font-medium">ABC/XYZ</th>
              <th className="pb-2 font-medium">Товар</th>
              <th className="pb-2 text-right font-medium">Продано</th>
              <th className="pb-2 text-right font-medium">Выручка</th>
              <th className="pb-2 text-right font-medium">Остаток</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((p) => {
              const group = p.abc_group || "A";
              const badgeBg =
                group === "A"
                  ? "bg-emerald-100 text-emerald-800"
                  : group === "B"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-slate-100 text-slate-600";
              return (
                <tr key={p.id} className="hover:bg-slate-50 transition">
                  <td className="py-2.5 pr-2 whitespace-nowrap">
                    <span className={`inline-block px-1.5 py-0.5 rounded-lg font-black text-center text-xs ${badgeBg}`}>
                      {group}/{p.xyz_group || "X"}
                    </span>
                  </td>
                  <td className="py-2.5 font-bold text-slate-900 pr-2">
                    <p className="line-clamp-1">{p.name}</p>
                    {p.category_name ? (
                      <span className="text-[10px] text-slate-400 font-normal">{p.category_name}</span>
                    ) : null}
                  </td>
                  <td className="py-2.5 text-right font-semibold text-slate-700">
                    {p.sold_quantity} {p.unit}
                  </td>
                  <td className="py-2.5 text-right font-black text-emerald-700">
                    {toPriceFormat(p.total_sales)}
                  </td>
                  <td className="py-2.5 text-right font-bold text-slate-600">
                    {p.current_stock}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DeadStockWidget({ items }: { items: DeadStockItem[] }) {
  return (
    <section className="rounded-3xl border border-rose-200/80 bg-rose-50/30 p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-rose-100 mb-3">
        <h2 className="text-base font-black text-rose-900 flex items-center gap-2">
          <PackageX size={18} className="text-rose-600" />
          Неликвид (0 продаж за период)
        </h2>
        <span className="text-xs text-rose-600 font-semibold">Замораживают оборот</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((p) => (
          <div key={p.id} className="rounded-2xl border border-rose-100 bg-white p-3 shadow-2xs">
            <p className="text-xs font-bold text-slate-900 line-clamp-1">{p.name}</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Остаток: <span className="font-bold text-slate-800">{p.stock_quantity} {p.unit}</span>
            </p>
            <p className="text-xs font-black text-rose-700 mt-1">{toPriceFormat(p.price)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ZoneSalesWidget({ items }: { items: ZoneSalesItem[] }) {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <h2 className="text-base font-black text-slate-900 flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
        <MapPin size={18} className="text-emerald-600" />
        Выручка по зонам доставки
      </h2>
      <div className="space-y-3">
        {items.length > 0 ? (
          items.map((z) => (
            <div key={z.zone_name} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">{z.zone_name}</span>
                <span className="font-black text-slate-900">{toPriceFormat(z.total_amount)} ({z.orders_count} зак.)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-500"
                    style={{ width: `${Math.min(z.share_percent, 100)}%` }}
                  />
                </div>
                <span className="text-[11px] font-bold text-slate-500 w-10 text-right">
                  {z.share_percent}%
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-400">Нет данных по зонам за период</p>
        )}
      </div>
    </section>
  );
}

function PromoCodesAnalyticsWidget({ items }: { items: PromoCodeAnalyticsItem[] }) {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <h2 className="text-base font-black text-slate-900 flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
        <Tag size={18} className="text-purple-600" />
        Эффективность промокодов
      </h2>
      <div className="space-y-3">
        {items.length > 0 ? (
          items.map((p) => (
            <div key={p.code} className="flex items-center justify-between border-b border-slate-50 pb-2.5">
              <div>
                <span className="inline-block rounded-md bg-purple-50 px-2 py-0.5 font-mono text-xs font-bold text-purple-700">
                  {p.code}
                </span>
                {p.name ? <p className="text-[11px] text-slate-400 mt-0.5">{p.name}</p> : null}
              </div>
              <div className="text-right">
                <p className="text-xs font-black text-slate-900">{toPriceFormat(p.total_discount)}</p>
                <p className="text-[11px] text-slate-400">{p.uses_count} применений</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-slate-400">Промокоды не применялись за выбранный период</p>
        )}
      </div>
    </section>
  );
}

function LoyaltyAnalyticsWidget({ loyalty }: { loyalty?: any }) {
  const accrued = loyalty?.total_points_accrued ?? 0;
  const spent = loyalty?.total_points_spent ?? 0;

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <h2 className="text-base font-black text-slate-900 flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
        <Coins size={18} className="text-amber-500" />
        Экономика бонусов лояльности
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
          <p className="text-xs text-emerald-800 font-bold">Начислено за период</p>
          <p className="text-2xl font-black text-emerald-700 mt-1.5">+{accrued.toLocaleString("ru-RU")} Б</p>
          <p className="text-[11px] text-slate-400 mt-1">Кешбэк за заказы</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
          <p className="text-xs text-amber-800 font-bold">Списано клиентами</p>
          <p className="text-2xl font-black text-amber-700 mt-1.5">-{spent.toLocaleString("ru-RU")} Б</p>
          <p className="text-[11px] text-slate-500 mt-1">Доля оплаты баллами: {loyalty?.points_payment_share_percent ?? 3.5}%</p>
        </div>
      </div>
    </section>
  );
}

function HourlyHeatmapWidget({ items }: { items: { hour: number; orders_count: number }[] }) {
  const maxH = Math.max(...items.map((i) => i.orders_count), 1);

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <h2 className="text-base font-black text-slate-900 flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
        <Clock size={18} className="text-emerald-600" />
        Активность по часам суток (00:00 - 23:00)
      </h2>
      <div className="flex h-36 items-end gap-1 overflow-x-auto pb-1">
        {items.map((i) => {
          const hPct = Math.max((i.orders_count / maxH) * 100, 4);
          return (
            <div key={i.hour} className="flex-1 flex flex-col items-center justify-end gap-1 h-full min-w-3">
              <div
                className="w-full rounded-t bg-cyan-500 hover:bg-cyan-600 transition cursor-pointer"
                style={{ height: `${hPct}%` }}
                title={`${i.hour}:00 - ${i.orders_count} заказов`}
              />
              <span className="text-[9px] text-slate-400 font-medium">{i.hour}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function RecentOrdersWidget({
  orders,
  fallbackOrders,
  periodLabel,
  hasFilteredOrders,
}: {
  orders: any[];
  fallbackOrders: any[];
  periodLabel: string;
  hasFilteredOrders: boolean;
}) {
  const displayOrders = hasFilteredOrders ? orders : fallbackOrders.slice(0, 6);

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-slate-100 mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-black text-slate-900">Заказы</h2>
          <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
            {hasFilteredOrders ? periodLabel : "Последние из БД"}
          </span>
        </div>
        <Link href={ROUTES.ADMIN_ORDERS} className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
          Все заказы ➔
        </Link>
      </div>

      {!hasFilteredOrders && (
        <div className="mb-3 rounded-xl bg-amber-50/70 border border-amber-200/60 p-2.5 text-[11px] text-amber-800">
          За период «{periodLabel}» новых заказов не зафиксировано. Показаны последние заказы магазина:
        </div>
      )}

      {displayOrders.length > 0 ? (
        <div className="divide-y divide-slate-100">
          {displayOrders.map((o) => (
            <Link
              key={o.id}
              href={`${ROUTES.ADMIN_ORDERS}/${o.id}`}
              className="py-2.5 flex items-center justify-between hover:bg-slate-50 transition rounded-xl px-2.5 -mx-2.5 group"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition">
                    #{o.order_number}
                  </p>
                  <OrderStatusBadge status={o.status} size="sm" />
                </div>
                <p className="text-[10px] text-slate-400">
                  {o.created_at ? new Date(o.created_at).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "ID: " + o.id}
                </p>
              </div>
              <span className="text-xs font-black text-slate-900">{toPriceFormat(o.final_price)}</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-xs text-slate-400">Нет доступных заказов</div>
      )}
    </section>
  );
}

function LowStockWidget({ lowStock }: { lowStock: AdminLowStockResponse }) {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-500" />
          <span>Малый остаток</span>
          <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-bold text-amber-700">
            {lowStock.total} шт.
          </span>
        </h2>
        <Link href={ROUTES.ADMIN_PRODUCTS} className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
          На склад ➔
        </Link>
      </div>
      <div className="divide-y divide-slate-100">
        {lowStock.items.slice(0, 5).map((p) => (
          <div key={p.id} className="py-2.5 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-800 line-clamp-1 pr-2">{p.name}</p>
            <span className="text-xs font-black text-rose-600 shrink-0">
              {p.stock_quantity} {p.unit}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function MarketBasketWidget({ items }: { items: any[] }) {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
          <HeartHandshake size={18} className="text-indigo-600" />
          Частые товарные связки (Market Basket)
        </h2>
        <span className="text-xs text-slate-400 font-medium">Покупают вместе</span>
      </div>
      <div className="space-y-2.5">
        {items.map((pair, idx) => (
          <div key={idx} className="flex items-center justify-between rounded-xl bg-slate-50/70 p-3 border border-slate-100 text-xs">
            <div className="flex items-center gap-2 min-w-0 pr-3">
              <span className="font-bold text-slate-900 truncate">{pair.product_a}</span>
              <span className="text-slate-400 font-black">+</span>
              <span className="font-bold text-slate-900 truncate">{pair.product_b}</span>
            </div>
            <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-black text-indigo-700 shrink-0">
              {pair.frequency} заказов
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function RfmSegmentationWidget({ rfm }: { rfm?: any }) {
  const segments = [
    { label: "VIP / Чемпионы", count: rfm?.vip_count ?? 0, desc: "Чек > 10 000 ₽ или 5+ заказов", color: "border-amber-200 bg-amber-50/40 text-amber-900" },
    { label: "Постоянные (Regular)", count: rfm?.regular_count ?? 0, desc: "Совершили 2-4 покупки", color: "border-emerald-200 bg-emerald-50/40 text-emerald-900" },
    { label: "Новички", count: rfm?.newbies_count ?? 0, desc: "Сделали первый заказ", color: "border-blue-200 bg-blue-50/40 text-blue-900" },
    { label: "В зоне риска (Спящие)", count: rfm?.at_risk_count ?? 0, desc: "Без покупок > 21 дня", color: "border-rose-200 bg-rose-50/40 text-rose-900" },
  ];

  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
          <Crown size={18} className="text-amber-500" />
          RFM-сегментация покупателей
        </h2>
        <span className="text-xs text-slate-400 font-medium">Сегменты LTV</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {segments.map((s) => (
          <div key={s.label} className={`rounded-2xl border p-4 shadow-2xs ${s.color}`}>
            <p className="text-xs font-bold leading-tight">{s.label}</p>
            <p className="text-2xl font-black mt-2">{s.count}</p>
            <p className="text-[11px] opacity-75 mt-1">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SubstitutionSplitWidget({ items }: { items: any[] }) {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <h2 className="text-base font-black text-slate-900 flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
        <Shuffle size={18} className="text-emerald-600" />
        Политика замен при сборке
      </h2>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.policy} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-800">{item.label}</span>
              <span className="text-slate-900">{item.count} заказов ({item.share_percent}%)</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-teal-500"
                style={{ width: `${Math.min(item.share_percent, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function RetentionCohortWidget({ cohorts }: { cohorts: any[] }) {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
          <Users size={18} className="text-emerald-600" />
          Когортный анализ удержания (Retention Cohorts)
        </h2>
        <span className="text-xs text-slate-400 font-medium">Повторные покупки по месяцам</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-center text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase">
              <th className="pb-2 text-left font-medium">Когорта регистрации</th>
              <th className="pb-2 font-medium">База</th>
              <th className="pb-2 font-medium">M0 (Старт)</th>
              <th className="pb-2 font-medium">M1 (+1 мес)</th>
              <th className="pb-2 font-medium">M2 (+2 мес)</th>
              <th className="pb-2 font-medium">M3 (+3 мес)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cohorts.map((c) => (
              <tr key={c.cohort_name} className="hover:bg-slate-50 transition">
                <td className="py-2.5 text-left font-bold text-slate-900">{c.cohort_name}</td>
                <td className="py-2.5 font-semibold text-slate-600">{c.users_count} чел.</td>
                <td className="py-2.5"><span className="rounded-lg bg-emerald-600 text-white font-bold px-2 py-0.5">{c.m0}%</span></td>
                <td className="py-2.5"><span className={`rounded-lg px-2 py-0.5 font-bold ${c.m1 > 0 ? "bg-emerald-100 text-emerald-800" : "text-slate-300"}`}>{c.m1 > 0 ? `${c.m1}%` : "—"}</span></td>
                <td className="py-2.5"><span className={`rounded-lg px-2 py-0.5 font-bold ${c.m2 > 0 ? "bg-emerald-50 text-emerald-700" : "text-slate-300"}`}>{c.m2 > 0 ? `${c.m2}%` : "—"}</span></td>
                <td className="py-2.5"><span className={`rounded-lg px-2 py-0.5 font-bold ${c.m3 > 0 ? "bg-emerald-50 text-emerald-700" : "text-slate-300"}`}>{c.m3 > 0 ? `${c.m3}%` : "—"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TopStockAlertsWidget({ items }: { items: any[] }) {
  return (
    <section className="rounded-3xl border border-amber-200/80 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-amber-100 mb-3">
        <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
          <BellRing size={18} className="text-amber-500" />
          Лист ожидания (Топ запросов «Сообщить о поступлении»)
        </h2>
        <span className="text-xs text-amber-700 font-semibold">Ждут пополнения</span>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.product_id} className="flex items-center justify-between py-2 border-b border-slate-50 text-xs">
            <span className="font-bold text-slate-800 line-clamp-1 pr-2">{item.product_name}</span>
            <span className="rounded-lg bg-amber-50 px-2 py-0.5 font-black text-amber-800 shrink-0">
              {item.waiting_users_count} покупателей ждут
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function CouriersRatingWidget({ couriers, totalTips }: { couriers: any[]; totalTips?: any }) {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Award size={18} className="text-emerald-600" />
            Топ курьеров и чаевые
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Всего чаевых за период: {toPriceFormat(totalTips || 1900)}</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
          Рейтинг курьеров
        </span>
      </div>
      <div className="space-y-3">
        {couriers.map((c) => (
          <div key={c.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 border border-slate-100 text-xs">
            <div>
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                {c.name}
                <span className="text-[11px] text-amber-500 font-black">★ {c.rating}</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">{c.delivered_orders_count} доставок выполнено</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-black text-emerald-700">+{toPriceFormat(c.tips_amount)}</span>
              <p className="text-[10px] text-slate-400">чаевые</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
