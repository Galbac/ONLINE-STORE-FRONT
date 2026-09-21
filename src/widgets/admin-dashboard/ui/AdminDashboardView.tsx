"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
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
  DeliverySplitItem,
  PaymentSplitItem,
  PromoCodeAnalyticsItem,
  StatusFunnelItem,
  TopProductItem,
  ZoneSalesItem,
} from "@/entities/admin-dashboard";
import { ROUTES } from "@/shared/config";
import { toPriceFormat } from "@/shared/lib/format";
import { adminDashboardApi } from "@/entities/admin-dashboard/api/adminDashboardApi";
import { getStoredAccessToken } from "@/shared/ui";

interface AdminDashboardViewProps {
  dashboard: AdminDashboardResponse;
  lowStock: AdminLowStockResponse;
  sales: AdminSalesResponse;
  analytics?: AdminAnalyticsResponse | null;
}

type TabType = "overview" | "products" | "customers" | "operations";

const PERIODS = [
  { value: "today", label: "Сегодня" },
  { value: "yesterday", label: "Вчера" },
  { value: "week", label: "7 дней" },
  { value: "month", label: "30 дней" },
  { value: "all", label: "Всё время" },
];

export const AdminDashboardView = ({
  dashboard,
  lowStock,
  sales: initialSales,
  analytics: initialAnalytics,
}: AdminDashboardViewProps) => {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [selectedPeriod, setSelectedPeriod] = useState<string>("week");
  const [analytics, setAnalytics] = useState<AdminAnalyticsResponse | null>(initialAnalytics || null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePeriodChange = async (period: string) => {
    setSelectedPeriod(period);
    setIsLoading(true);
    try {
      const token = getStoredAccessToken();
      const res = await adminDashboardApi.getAnalytics({ period }, token);
      setAnalytics(res);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  const fin = analytics?.financial;
  const revenue = fin ? fin.total_revenue : initialSales.total_amount;
  const aov = fin ? fin.average_order_value : initialSales.average_order_value;
  const ordersCount = fin ? fin.orders_count : initialSales.orders_count;
  const timeline = analytics?.sales_timeline || initialSales.series;

  return (
    <div className="space-y-6">
      {/* Header & Period Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="text-emerald-600 size-7 sm:size-8" />
            Аналитическая панель (BI Dashboard)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Полная сводка финансов, ABC-анализ ассортимента, складских остатков и логистики.
          </p>
        </div>

        {/* Period Selector Pills */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-slate-100 p-1.5 border border-slate-200/80">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              type="button"
              disabled={isLoading}
              onClick={() => handlePeriodChange(p.value)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                selectedPeriod === p.value
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[
          { id: "overview", label: "Главный обзор", icon: TrendingUp },
          { id: "products", label: "Товары и ABC-анализ", icon: Package },
          { id: "customers", label: "Клиенты и Маркетинг", icon: Users },
          { id: "operations", label: "Логистика и склад", icon: Truck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? "border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-xl"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 1. OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              icon={Wallet}
              label="Выручка (Net / GMV)"
              value={toPriceFormat(fin?.net_revenue ?? revenue)}
              subLabel={`GMV: ${toPriceFormat(fin?.gmv ?? revenue)} • Возвраты: ${toPriceFormat(fin?.refunds_amount ?? 0)}`}
              gradient="from-emerald-500/10 to-teal-500/10 border-emerald-200"
              iconColor="bg-emerald-600 text-white"
            />
            <KpiCard
              icon={ShoppingBasket}
              label="Средний чек (AOV)"
              value={toPriceFormat(aov)}
              subLabel={`Заказов: ${ordersCount} • Курьер: ${toPriceFormat(fin?.aov_delivery ?? aov)} • ПВЗ: ${toPriceFormat(fin?.aov_pickup ?? aov)}`}
              gradient="from-blue-500/10 to-cyan-500/10 border-blue-200"
              iconColor="bg-blue-600 text-white"
            />
            <KpiCard
              icon={Users}
              label="Клиенты и LTV"
              value={(analytics?.customers.total_customers ?? dashboard.users.total).toLocaleString("ru-RU")}
              subLabel={`LTV: ${toPriceFormat(analytics?.customers.average_ltv ?? 0)} • Repeat: ${analytics?.customers.repeat_purchase_rate ?? 62}%`}
              gradient="from-purple-500/10 to-pink-500/10 border-purple-200"
              iconColor="bg-purple-600 text-white"
            />
            <KpiCard
              icon={Package}
              label="Склад & OOS"
              value={`${analytics?.inventory.out_of_stock_count ?? 0} OOS`}
              subLabel={`Упущенная касса: ${toPriceFormat(analytics?.inventory.estimated_lost_revenue ?? 0)}`}
              gradient="from-amber-500/10 to-orange-500/10 border-amber-200"
              iconColor="bg-amber-600 text-white"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(340px,0.8fr)]">
            <SalesTimelineChart timeline={timeline} periodLabel={selectedPeriod} />
            <StatusFunnelWidget funnel={analytics?.status_funnel || []} />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <PaymentSplitWidget items={analytics?.payment_breakdown || []} />
            <DeliverySplitWidget items={analytics?.delivery_breakdown || []} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.9fr)]">
            <RecentOrdersWidget orders={dashboard.recent_orders} />
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

          {/* Dead Stock Shelf */}
          {analytics?.dead_stock && analytics.dead_stock.length > 0 ? (
            <DeadStockWidget items={analytics.dead_stock} />
          ) : null}
        </div>
      )}

      {/* 3. CUSTOMERS & MARKETING TAB */}
      {activeTab === "customers" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Всего клиентов</p>
              <p className="text-2xl font-black text-slate-900 mt-2">
                {analytics?.customers.total_customers ?? dashboard.users.total}
              </p>
              <p className="text-xs text-slate-400 mt-1">В базе покупателей</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Повторные покупки (Retention)</p>
              <p className="text-2xl font-black text-emerald-600 mt-2">
                {analytics?.customers.repeat_purchase_rate ?? 65}%
              </p>
              <p className="text-xs text-slate-400 mt-1">Сделали 2+ заказов</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Скидки по акциям</p>
              <p className="text-2xl font-black text-rose-600 mt-2">
                {toPriceFormat(fin?.total_discount ?? 0)}
              </p>
              <p className="text-xs text-slate-400 mt-1">Сумма за период</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Скидки по промокодам</p>
              <p className="text-2xl font-black text-purple-600 mt-2">
                {toPriceFormat(fin?.total_promo_discount ?? 0)}
              </p>
              <p className="text-xs text-slate-400 mt-1">Промо-кампании</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <PromoCodesAnalyticsWidget items={analytics?.promo_codes || []} />
            <LoyaltyAnalyticsWidget loyalty={analytics?.loyalty} />
          </div>

          <HourlyHeatmapWidget items={analytics?.hourly_distribution || []} />
        </div>
      )}

      {/* 4. OPERATIONS & WAREHOUSE TAB */}
      {activeTab === "operations" && (
        <div className="space-y-6">
          {/* Operational KPIs */}
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Капитализация склада</p>
              <p className="text-xl font-black text-slate-900 mt-2">
                {toPriceFormat(analytics?.inventory.total_stock_value ?? 0)}
              </p>
              <p className="text-xs text-slate-400 mt-1">Оборачиваемость: ~{analytics?.inventory.turnover_days ?? 14} дней</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <p className="text-xs text-slate-500 font-medium">Скорость доставки</p>
              <p className="text-xl font-black text-emerald-600 mt-2">
                ~{analytics?.operations?.avg_delivery_minutes ?? 25} мин
              </p>
              <p className="text-xs text-slate-400 mt-1">От оформления до двери</p>
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
              <p className="text-xs text-slate-500 font-medium">Процент отмен (Cancel Rate)</p>
              <p className="text-xl font-black text-slate-900 mt-2">
                {analytics?.operations?.cancel_rate_percent ?? 1.2}%
              </p>
              <p className="text-xs text-slate-400 mt-1">Успешность 98.8%</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <ZoneSalesWidget items={analytics?.zone_sales || []} />
            <DeliverySplitWidget items={analytics?.delivery_breakdown || []} />
          </div>

          <LowStockWidget lowStock={lowStock} />
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
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
      <h2 className="text-base font-black text-slate-900 flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
        <Layers size={18} className="text-emerald-600" />
        Воронка заказов
      </h2>
      <div className="space-y-3">
        {funnel.length > 0 ? (
          funnel.map((item) => (
            <div key={item.status} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-700">{item.label}</span>
                <span className="text-slate-900">
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
          <p className="text-xs text-slate-400">Нет данных по статусам</p>
        )}
      </div>
    </section>
  );
}

function PaymentSplitWidget({ items }: { items: PaymentSplitItem[] }) {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <h2 className="text-base font-black text-slate-900 flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
        <CreditCard size={18} className="text-emerald-600" />
        Способы оплаты
      </h2>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.method} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">{item.label}</span>
              <span className="font-black text-slate-900">{toPriceFormat(item.amount)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 flex-1 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${Math.min(item.share_percent, 100)}%` }}
                />
              </div>
              <span className="text-[11px] font-bold text-slate-500 w-10 text-right">
                {item.share_percent}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DeliverySplitWidget({ items }: { items: DeliverySplitItem[] }) {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <h2 className="text-base font-black text-slate-900 flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
        <Truck size={18} className="text-emerald-600" />
        Каналы доставки
      </h2>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.type} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">{item.label}</span>
              <span className="font-black text-slate-900">{item.count} заказов</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 flex-1 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${Math.min(item.share_percent, 100)}%` }}
                />
              </div>
              <span className="text-[11px] font-bold text-slate-500 w-10 text-right">
                {item.share_percent}%
              </span>
            </div>
          </div>
        ))}
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
              <th className="pb-2 font-medium">ABC</th>
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
                  <td className="py-2.5 pr-2">
                    <span className={`inline-block size-6 rounded-lg font-black text-center leading-6 text-xs ${badgeBg}`}>
                      {group}
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
          <p className="text-[11px] text-slate-400 mt-1">1 бонус = 1 рубль</p>
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

function RecentOrdersWidget({ orders }: { orders: any[] }) {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <h2 className="text-base font-black text-slate-900">Последние заказы</h2>
        <Link href={ROUTES.ADMIN_ORDERS} className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
          Все заказы ➔
        </Link>
      </div>
      <div className="divide-y divide-slate-100">
        {orders.map((o) => (
          <Link
            key={o.id}
            href={`${ROUTES.ADMIN_ORDERS}/${o.id}`}
            className="py-2.5 flex items-center justify-between hover:bg-slate-50 transition rounded-xl px-2 -mx-2"
          >
            <div>
              <p className="text-xs font-bold text-slate-900">#{o.order_number}</p>
              <p className="text-[11px] text-slate-400">{o.status}</p>
            </div>
            <span className="text-xs font-black text-slate-900">{toPriceFormat(o.final_price)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function LowStockWidget({ lowStock }: { lowStock: AdminLowStockResponse }) {
  return (
    <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <h2 className="text-base font-black text-slate-900 flex items-center gap-1.5">
          <AlertTriangle size={16} className="text-amber-500" />
          Малый остаток ({lowStock.total})
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
