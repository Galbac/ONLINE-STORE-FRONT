import Link from "next/link";
import { BadgePercent, ClipboardList, Package, Plus, ShoppingBasket, Wallet } from "lucide-react";
import type {
  AdminDashboardResponse,
  AdminLowStockResponse,
  AdminSalesResponse,
  AdminSalesSeriesItem,
} from "@/entities/admin-dashboard";
import { ROUTES } from "@/shared/config";
import { toPriceFormat } from "@/shared/lib/format";

interface AdminDashboardViewProps {
  dashboard: AdminDashboardResponse;
  lowStock: AdminLowStockResponse;
  sales: AdminSalesResponse;
}

const quickActions = [
  {
    href: ROUTES.ADMIN_ORDERS,
    icon: ClipboardList,
    label: "Открыть заказы",
  },
  {
    href: ROUTES.ADMIN_PRODUCTS,
    icon: Package,
    label: "Перейти к товарам",
  },
  {
    href: ROUTES.ADMIN_DISCOUNTS,
    icon: BadgePercent,
    label: "Управлять скидками",
  },
] as const;

export const AdminDashboardView = ({ dashboard, lowStock, sales }: AdminDashboardViewProps) => {
  return (
    <div className="space-y-6">
      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">Dashboard</h1>
            <p className="text-text-secondary mt-2">
              Продажи, заказы и товары, требующие внимания.
            </p>
          </div>
          <span className="border-border bg-bg-primary text-text-secondary rounded-lg border px-3 py-2 text-sm font-bold">
            {formatDateRange(sales.date_from, sales.date_to)}
          </span>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={Wallet}
            label="Продажи за период"
            value={toPriceFormat(sales.total_amount)}
            subValue={`Средний чек ${toPriceFormat(sales.average_order_value)}`}
          />
          <MetricCard
            icon={ShoppingBasket}
            label="Количество заказов"
            value={sales.orders_count.toLocaleString("ru-RU")}
            subValue={`Сегодня ${dashboard.orders.today_count}`}
          />
          <MetricCard
            icon={ClipboardList}
            label="Новые заказы"
            value={dashboard.orders.new_count.toLocaleString("ru-RU")}
            subValue={`Оплачено сегодня ${dashboard.orders.paid_today_count}`}
          />
          <MetricCard
            icon={Package}
            label="Низкий остаток"
            value={dashboard.products.low_stock_count.toLocaleString("ru-RU")}
            subValue={`Активных товаров ${dashboard.products.total_active}`}
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.75fr)]">
        <SalesChart sales={sales} />
        <QuickActions />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
        <LowStockList lowStock={lowStock} />
        <RecentOrders dashboard={dashboard} />
      </section>
    </div>
  );
};

interface MetricCardProps {
  icon: typeof Wallet;
  label: string;
  subValue: string;
  value: string;
}

const MetricCard = ({ icon: Icon, label, subValue, value }: MetricCardProps) => {
  return (
    <article className="border-border bg-bg-primary rounded-lg border p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-text-secondary text-sm">{label}</p>
          <p className="mt-3 truncate text-2xl font-bold text-text-primary">{value}</p>
        </div>
        <span className="bg-bg-hover text-accent-primary grid size-11 shrink-0 place-items-center rounded-lg">
          <Icon size={22} />
        </span>
      </div>
      <p className="text-text-muted mt-4 truncate text-sm">{subValue}</p>
    </article>
  );
};

const SalesChart = ({ sales }: { sales: AdminSalesResponse }) => {
  const maxAmount = Math.max(...sales.series.map((item) => Number(item.amount)), 0);

  return (
    <section className="border-border bg-bg-primary rounded-lg border p-5 shadow-soft sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-text-primary">График продаж</h2>
          <p className="text-text-secondary mt-1 text-sm">Группировка: {getGroupLabel(sales.group_by)}</p>
        </div>
        <span className="text-text-secondary text-sm font-bold">
          {sales.orders_count.toLocaleString("ru-RU")} заказов
        </span>
      </div>

      <div className="mt-6 flex h-64 items-end gap-2 overflow-x-auto border-b border-border pb-3">
        {sales.series.length > 0 ? (
          sales.series.map((item) => (
            <ChartBar item={item} key={item.date} maxAmount={maxAmount} />
          ))
        ) : (
          <EmptyState text="За выбранный период продаж нет." />
        )}
      </div>
    </section>
  );
};

const ChartBar = ({ item, maxAmount }: { item: AdminSalesSeriesItem; maxAmount: number }) => {
  const amount = Number(item.amount);
  const heightPercent = maxAmount > 0 ? Math.max((amount / maxAmount) * 100, 6) : 6;

  return (
    <div className="flex h-full min-w-14 flex-1 flex-col justify-end gap-2">
      <div className="flex min-h-0 flex-1 items-end">
        <div
          className="bg-accent-primary w-full rounded-t-lg"
          style={{ height: `${heightPercent}%` }}
          title={`${formatShortDate(item.date)}: ${toPriceFormat(item.amount)}`}
        />
      </div>
      <span className="text-text-muted truncate text-center text-xs">{formatShortDate(item.date)}</span>
    </div>
  );
};

const QuickActions = () => {
  return (
    <section className="border-border bg-bg-primary rounded-lg border p-5 shadow-soft sm:p-6">
      <h2 className="text-xl font-bold text-text-primary">Быстрые действия</h2>
      <div className="mt-5 space-y-3">
        {quickActions.map((action) => {
          const Icon = action.icon;

          return (
            <Link
              className="border-border hover:bg-bg-hover flex h-13 items-center justify-between gap-3 rounded-lg border px-4 text-sm font-bold transition"
              href={action.href}
              key={action.href}
            >
              <span className="flex min-w-0 items-center gap-3">
                <Icon className="text-accent-primary shrink-0" size={20} />
                <span className="truncate">{action.label}</span>
              </span>
              <Plus className="text-text-muted shrink-0" size={18} />
            </Link>
          );
        })}
      </div>
    </section>
  );
};

const LowStockList = ({ lowStock }: { lowStock: AdminLowStockResponse }) => {
  return (
    <section className="border-border bg-bg-primary rounded-lg border p-5 shadow-soft sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-text-primary">Товары с низким остатком</h2>
        <span className="text-text-secondary text-sm font-bold">{lowStock.total}</span>
      </div>
      <div className="mt-5 space-y-3">
        {lowStock.items.length > 0 ? (
          lowStock.items.map((product) => (
            <div
              className="border-border grid gap-3 rounded-lg border p-4 sm:grid-cols-[minmax(0,1fr)_auto]"
              key={product.id}
            >
              <div className="min-w-0">
                <p className="truncate font-bold text-text-primary">{product.name}</p>
                <p className="text-text-muted mt-1 text-sm">
                  {product.sku ? `SKU ${product.sku}` : product.product_type}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="font-bold text-error">
                  {formatQuantity(product.stock_quantity)} {product.unit}
                </p>
                <p className="text-text-muted mt-1 text-sm">
                  порог {formatQuantity(product.low_stock_threshold)}
                </p>
              </div>
            </div>
          ))
        ) : (
          <EmptyState text="Товаров с низким остатком нет." />
        )}
      </div>
    </section>
  );
};

const RecentOrders = ({ dashboard }: { dashboard: AdminDashboardResponse }) => {
  return (
    <section className="border-border bg-bg-primary rounded-lg border p-5 shadow-soft sm:p-6">
      <h2 className="text-xl font-bold text-text-primary">Новые заказы</h2>
      <div className="mt-5 space-y-3">
        {dashboard.recent_orders.length > 0 ? (
          dashboard.recent_orders.map((order) => (
            <Link
              className="border-border hover:bg-bg-hover grid gap-3 rounded-lg border p-4 transition sm:grid-cols-[minmax(0,1fr)_auto]"
              href={`${ROUTES.ADMIN_ORDERS}/${order.id}`}
              key={order.id}
            >
              <div className="min-w-0">
                <p className="truncate font-bold text-text-primary">#{order.order_number}</p>
                <p className="text-text-muted mt-1 text-sm">{formatDateTime(order.created_at)}</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="font-bold text-text-primary">{toPriceFormat(order.final_price)}</p>
                <p className="text-text-muted mt-1 text-sm">{order.status}</p>
              </div>
            </Link>
          ))
        ) : (
          <EmptyState text="Новых заказов нет." />
        )}
      </div>
    </section>
  );
};

const EmptyState = ({ text }: { text: string }) => {
  return <p className="text-text-secondary rounded-lg bg-bg-secondary p-4 text-sm">{text}</p>;
};

const getGroupLabel = (groupBy: AdminSalesResponse["group_by"]): string => {
  const labels: Record<AdminSalesResponse["group_by"], string> = {
    day: "день",
    month: "месяц",
    week: "неделя",
  };

  return labels[groupBy];
};

const formatShortDate = (date: string): string => {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(date));
};

const formatDateRange = (dateFrom: string, dateTo: string): string => {
  return `${formatShortDate(dateFrom)} - ${formatShortDate(dateTo)}`;
};

const formatDateTime = (date: string): string => {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
  }).format(new Date(date));
};

const formatQuantity = (value: string): string => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return value;
  }

  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 3,
  }).format(amount);
};
