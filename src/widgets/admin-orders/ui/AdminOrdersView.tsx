import type { ReactNode } from "react";
import Link from "next/link";
import { Eye, Search } from "lucide-react";
import type { AdminOrderListItemResponse, AdminOrderListResponse } from "@/entities/admin-order";
import { ROUTES } from "@/shared/config";
import { toPriceFormat } from "@/shared/lib/format";

export interface AdminOrderFilters {
  date_from: string;
  date_to: string;
  delivery_type: string;
  page: string;
  payment_status: string;
  q: string;
  status: string;
  sync_status: string;
}

interface AdminOrdersViewProps {
  filters: AdminOrderFilters;
  orders: AdminOrderListResponse;
}

export const AdminOrdersView = ({ filters, orders }: AdminOrdersViewProps) => {
  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-text-primary text-2xl font-bold sm:text-3xl">Заказы</h1>
        <p className="text-text-secondary mt-2">
          Поиск, фильтры, оплата, доставка и статусы синхронизации 1С.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Всего найдено" value={orders.total.toLocaleString("ru-RU")} />
        <SummaryCard label="На странице" value={orders.items.length.toLocaleString("ru-RU")} />
        <SummaryCard label="Страниц" value={(orders.pages || 1).toLocaleString("ru-RU")} />
      </section>

      <OrdersFilters filters={filters} />

      <section className="border-border bg-bg-primary shadow-soft overflow-hidden rounded-lg border">
        <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <div>
            <h2 className="text-text-primary font-bold">Список заказов</h2>
            <p className="text-text-secondary mt-1 text-sm">
              Страница {orders.page} из {orders.pages || 1}
            </p>
          </div>
          <span className="text-text-secondary text-sm font-bold">
            {orders.items.length} из {orders.total}
          </span>
        </div>

        {orders.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] border-collapse text-left">
              <thead className="bg-bg-secondary text-text-muted text-xs uppercase">
                <tr>
                  <TableHeader>Заказ</TableHeader>
                  <TableHeader>Клиент</TableHeader>
                  <TableHeader>Сумма</TableHeader>
                  <TableHeader>Статус</TableHeader>
                  <TableHeader>Оплата</TableHeader>
                  <TableHeader>Получение</TableHeader>
                  <TableHeader>sync_status</TableHeader>
                  <TableHeader>Создан</TableHeader>
                  <TableHeader />
                </tr>
              </thead>
              <tbody>
                {orders.items.map((order) => (
                  <OrderRow key={order.id} order={order} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-text-secondary p-5">По выбранным фильтрам заказы не найдены.</p>
        )}

        <Pagination filters={filters} orders={orders} />
      </section>
    </div>
  );
};

const SummaryCard = ({ label, value }: { label: string; value: string }) => {
  return (
    <article className="border-border bg-bg-primary shadow-soft rounded-lg border p-5">
      <p className="text-text-secondary text-sm">{label}</p>
      <p className="text-text-primary mt-2 text-2xl font-bold">{value}</p>
    </article>
  );
};

const OrdersFilters = ({ filters }: { filters: AdminOrderFilters }) => {
  return (
    <form className="border-border bg-bg-primary shadow-soft rounded-lg border p-4" method="get">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-8">
        <label className="md:col-span-2">
          <span className="mb-2 block text-sm font-bold">Поиск</span>
          <span className="border-border focus-within:border-accent-primary flex h-11 items-center gap-2 rounded-lg border px-3 transition">
            <Search className="text-text-muted shrink-0" size={18} />
            <input
              className="placeholder:text-text-muted min-w-0 flex-1 bg-transparent text-sm outline-none"
              defaultValue={filters.q}
              name="q"
              placeholder="Номер, телефон, email, имя"
              type="search"
            />
          </span>
        </label>

        <FilterInput defaultValue={filters.status} label="Статус заказа" name="status" />
        <FilterInput
          defaultValue={filters.payment_status}
          label="Статус оплаты"
          name="payment_status"
        />
        <FilterInput
          defaultValue={filters.delivery_type}
          label="Доставка"
          name="delivery_type"
          placeholder="delivery / pickup"
        />
        <FilterInput defaultValue={filters.sync_status} label="sync_status" name="sync_status" />
        <FilterInput
          defaultValue={filters.date_from}
          label="Дата от"
          name="date_from"
          type="date"
        />
        <FilterInput defaultValue={filters.date_to} label="Дата до" name="date_to" type="date" />
      </div>

      <input name="page" type="hidden" value="1" />

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          className="bg-accent-primary text-accent-contrast hover:bg-accent-hover h-11 rounded-lg px-4 text-sm font-bold transition"
          type="submit"
        >
          Применить
        </button>
        <Link
          className="border-border hover:bg-bg-hover inline-flex h-11 items-center justify-center rounded-lg border px-4 text-sm font-bold transition"
          href={ROUTES.ADMIN_ORDERS}
        >
          Сбросить
        </Link>
      </div>
    </form>
  );
};

interface FilterInputProps {
  defaultValue: string;
  label: string;
  name: string;
  placeholder?: string;
  type?: "date" | "search" | "text";
}

const FilterInput = ({
  defaultValue,
  label,
  name,
  placeholder = "Статус",
  type = "text",
}: FilterInputProps) => {
  return (
    <label>
      <span className="mb-2 block text-sm font-bold">{label}</span>
      <input
        className="border-border focus:border-accent-primary placeholder:text-text-muted h-11 w-full rounded-lg border bg-transparent px-3 text-sm transition outline-none"
        defaultValue={defaultValue}
        name={name}
        placeholder={type === "date" ? undefined : placeholder}
        type={type}
      />
    </label>
  );
};

const OrderRow = ({ order }: { order: AdminOrderListItemResponse }) => {
  return (
    <tr className="border-border border-t align-top">
      <TableCell>
        <Link
          className="hover:text-accent-primary font-bold transition"
          href={ROUTES.ADMIN_ORDER(order.id)}
        >
          {order.order_number}
        </Link>
        <p className="text-text-muted mt-1 text-xs">ID: {order.id}</p>
      </TableCell>
      <TableCell>
        <p className="text-text-primary max-w-[220px] truncate font-bold">{order.customer_name}</p>
        <p className="text-text-muted mt-1 text-xs">{order.customer_phone}</p>
      </TableCell>
      <TableCell>{toPriceFormat(order.final_price)}</TableCell>
      <TableCell>
        <TextPill>{order.status}</TextPill>
      </TableCell>
      <TableCell>
        <p className="text-text-primary font-bold">{order.payment_status ?? "-"}</p>
        <p className="text-text-muted mt-1 text-xs">{order.payment_method ?? "-"}</p>
      </TableCell>
      <TableCell>{order.delivery_type}</TableCell>
      <TableCell>{order.sync_status}</TableCell>
      <TableCell>{formatDate(order.created_at)}</TableCell>
      <TableCell>
        <Link
          aria-label={`Открыть заказ ${order.order_number}`}
          className="border-border hover:bg-bg-hover inline-flex size-9 items-center justify-center rounded-lg border transition"
          href={ROUTES.ADMIN_ORDER(order.id)}
        >
          <Eye size={17} />
        </Link>
      </TableCell>
    </tr>
  );
};

const TextPill = ({ children }: { children: ReactNode }) => {
  return (
    <span className="bg-bg-secondary border-border text-text-primary inline-flex rounded-lg border px-2.5 py-1 text-xs font-bold">
      {children}
    </span>
  );
};

const Pagination = ({
  filters,
  orders,
}: {
  filters: AdminOrderFilters;
  orders: AdminOrderListResponse;
}) => {
  const previousPage = Math.max(orders.page - 1, 1);
  const nextPage = Math.min(orders.page + 1, orders.pages || 1);

  return (
    <div className="border-border flex flex-wrap items-center justify-between gap-3 border-t p-4">
      <p className="text-text-secondary text-sm">
        {orders.total > 0
          ? `${(orders.page - 1) * orders.limit + 1}-${Math.min(
              orders.page * orders.limit,
              orders.total,
            )} из ${orders.total}`
          : "0 из 0"}
      </p>
      <div className="flex gap-2">
        <PaginationLink
          disabled={orders.page <= 1}
          href={createOrdersHref(filters, previousPage)}
          label="Назад"
        />
        <PaginationLink
          disabled={orders.page >= orders.pages}
          href={createOrdersHref(filters, nextPage)}
          label="Вперед"
        />
      </div>
    </div>
  );
};

const PaginationLink = ({
  disabled,
  href,
  label,
}: {
  disabled: boolean;
  href: string;
  label: string;
}) => {
  if (disabled) {
    return (
      <span className="border-border text-text-muted inline-flex h-10 items-center rounded-lg border px-3 text-sm font-bold opacity-60">
        {label}
      </span>
    );
  }

  return (
    <Link
      className="border-border hover:bg-bg-hover inline-flex h-10 items-center rounded-lg border px-3 text-sm font-bold transition"
      href={href}
    >
      {label}
    </Link>
  );
};

const TableHeader = ({ children }: { children?: ReactNode }) => {
  return <th className="px-4 py-3 font-bold">{children}</th>;
};

const TableCell = ({ children }: { children: ReactNode }) => {
  return <td className="px-4 py-4 text-sm">{children}</td>;
};

const createOrdersHref = (filters: AdminOrderFilters, page: number): string => {
  const params = new URLSearchParams();

  Object.entries({ ...filters, page: String(page) }).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const query = params.toString();

  return query ? `${ROUTES.ADMIN_ORDERS}?${query}` : ROUTES.ADMIN_ORDERS;
};

const formatDate = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};
