"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Eye, Plus, Search, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import {
  adminDiscountApi,
  type AdminDiscountListItemResponse,
  type AdminDiscountListResponse,
} from "@/entities/admin-discount";
import { ROUTES } from "@/shared/config";

export interface AdminDiscountFilters {
  is_active: string;
  page: string;
  q: string;
  type: string;
}

interface AdminDiscountsViewProps {
  discounts: AdminDiscountListResponse;
  filters: AdminDiscountFilters;
}

type PendingAction = `activate-${number}` | `deactivate-${number}` | `delete-${number}`;

export const AdminDiscountsView = ({ discounts, filters }: AdminDiscountsViewProps) => {
  const [items, setItems] = useState(discounts.items);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const runAction = async (action: PendingAction, handler: () => Promise<void>): Promise<void> => {
    setPendingAction(action);
    setMessage(null);
    setError(null);

    try {
      await handler();
    } catch {
      setError("Операция не выполнена. Проверьте права доступа или войдите заново.");
    } finally {
      setPendingAction(null);
    }
  };

  const handleActivate = (discountId: number): void => {
    void runAction(`activate-${discountId}`, async () => {
      const response = await adminDiscountApi.activate(discountId);
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === discountId ? { ...item, is_active: response.is_active } : item,
        ),
      );
      setMessage(response.message);
    });
  };

  const handleDeactivate = (discountId: number): void => {
    void runAction(`deactivate-${discountId}`, async () => {
      const response = await adminDiscountApi.deactivate(discountId);
      setItems((currentItems) =>
        currentItems.map((item) =>
          item.id === discountId ? { ...item, is_active: response.is_active } : item,
        ),
      );
      setMessage(response.message);
    });
  };

  const handleDelete = (discountId: number): void => {
    if (!window.confirm("Удалить скидку? Действие нельзя отменить.")) {
      return;
    }

    void runAction(`delete-${discountId}`, async () => {
      const response = await adminDiscountApi.delete(discountId);
      setItems((currentItems) => currentItems.filter((item) => item.id !== discountId));
      setMessage(response.message);
    });
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-text-primary text-2xl font-bold sm:text-3xl">Скидки</h1>
          <p className="text-text-secondary mt-2">
            Управление скидками на товары, категории и корзину.
          </p>
        </div>
        <Link
          className="bg-accent-primary text-accent-contrast hover:bg-accent-hover inline-flex h-11 items-center gap-2 rounded-lg px-4 text-sm font-bold transition"
          href={ROUTES.ADMIN_DISCOUNT_CREATE}
        >
          <Plus size={18} />
          Создать
        </Link>
      </section>

      {message ? <Alert tone="success">{message}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Всего найдено" value={discounts.total.toLocaleString("ru-RU")} />
        <SummaryCard label="На странице" value={items.length.toLocaleString("ru-RU")} />
        <SummaryCard label="Страниц" value={(discounts.pages || 1).toLocaleString("ru-RU")} />
      </section>

      <DiscountFilters filters={filters} />

      <section className="border-border bg-bg-primary shadow-soft overflow-hidden rounded-lg border">
        <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <div>
            <h2 className="text-text-primary font-bold">Список скидок</h2>
            <p className="text-text-secondary mt-1 text-sm">
              Страница {discounts.page} из {discounts.pages || 1}
            </p>
          </div>
          <span className="text-text-secondary text-sm font-bold">
            {items.length} из {discounts.total}
          </span>
        </div>

        {items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] border-collapse text-left">
              <thead className="bg-bg-secondary text-text-muted text-xs uppercase">
                <tr>
                  <TableHeader>Скидка</TableHeader>
                  <TableHeader>Тип</TableHeader>
                  <TableHeader>Значение</TableHeader>
                  <TableHeader>Активность</TableHeader>
                  <TableHeader>Период</TableHeader>
                  <TableHeader>Создана</TableHeader>
                  <TableHeader>Действия</TableHeader>
                </tr>
              </thead>
              <tbody>
                {items.map((discount) => (
                  <DiscountRow
                    discount={discount}
                    key={discount.id}
                    onActivate={handleActivate}
                    onDeactivate={handleDeactivate}
                    onDelete={handleDelete}
                    pendingAction={pendingAction}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-text-secondary p-5">По выбранным фильтрам скидки не найдены.</p>
        )}

        <Pagination discounts={discounts} filters={filters} />
      </section>
    </div>
  );
};

const DiscountFilters = ({ filters }: { filters: AdminDiscountFilters }) => {
  return (
    <form className="border-border bg-bg-primary shadow-soft rounded-lg border p-4" method="get">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="xl:col-span-2">
          <span className="mb-2 block text-sm font-bold">Поиск</span>
          <span className="border-border focus-within:border-accent-primary flex h-11 items-center gap-2 rounded-lg border px-3 transition">
            <Search className="text-text-muted shrink-0" size={18} />
            <input
              className="placeholder:text-text-muted min-w-0 flex-1 bg-transparent text-sm outline-none"
              defaultValue={filters.q}
              name="q"
              placeholder="Название скидки"
              type="search"
            />
          </span>
        </label>

        <FilterSelect defaultValue={filters.type} label="Тип" name="type">
          <option value="">Все типы</option>
          <option value="product">Товар</option>
          <option value="category">Категория</option>
          <option value="cart">Корзина</option>
        </FilterSelect>

        <FilterSelect defaultValue={filters.is_active} label="Активность" name="is_active">
          <option value="">Все</option>
          <option value="true">Активные</option>
          <option value="false">Неактивные</option>
        </FilterSelect>
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
          href={ROUTES.ADMIN_DISCOUNTS}
        >
          Сбросить
        </Link>
      </div>
    </form>
  );
};

const DiscountRow = ({
  discount,
  onActivate,
  onDeactivate,
  onDelete,
  pendingAction,
}: {
  discount: AdminDiscountListItemResponse;
  onActivate: (discountId: number) => void;
  onDeactivate: (discountId: number) => void;
  onDelete: (discountId: number) => void;
  pendingAction: PendingAction | null;
}) => {
  return (
    <tr className="border-border border-t align-top">
      <TableCell>
        <Link
          className="hover:text-accent-primary block max-w-[280px] truncate font-bold transition"
          href={ROUTES.ADMIN_DISCOUNT_EDIT(discount.id)}
        >
          {discount.name}
        </Link>
        <p className="text-text-muted mt-1 text-xs">ID: {discount.id}</p>
      </TableCell>
      <TableCell>
        <p>{getTargetTypeLabel(discount.type)}</p>
        <p className="text-text-muted mt-1 text-xs">{discount.type}</p>
      </TableCell>
      <TableCell>{formatDiscountValue(discount.discount_type, discount.discount_value)}</TableCell>
      <TableCell>
        <StatusPill active={discount.is_active} falseLabel="Неактивна" trueLabel="Активна" />
      </TableCell>
      <TableCell>
        <p>{formatNullableDate(discount.starts_at)}</p>
        <p className="text-text-muted mt-1 text-xs">до {formatNullableDate(discount.ends_at)}</p>
      </TableCell>
      <TableCell>{formatDate(discount.created_at)}</TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-2">
          <Link
            aria-label={`Открыть скидку ${discount.name}`}
            className="border-border hover:bg-bg-hover inline-flex size-9 items-center justify-center rounded-lg border transition"
            href={ROUTES.ADMIN_DISCOUNT_EDIT(discount.id)}
          >
            <Eye size={17} />
          </Link>
          {discount.is_active ? (
            <ActionButton
              ariaLabel={`Деактивировать скидку ${discount.name}`}
              disabled={pendingAction === `deactivate-${discount.id}`}
              icon={<ToggleLeft size={17} />}
              onClick={() => onDeactivate(discount.id)}
            />
          ) : (
            <ActionButton
              ariaLabel={`Активировать скидку ${discount.name}`}
              disabled={pendingAction === `activate-${discount.id}`}
              icon={<ToggleRight size={17} />}
              onClick={() => onActivate(discount.id)}
            />
          )}
          <ActionButton
            ariaLabel={`Удалить скидку ${discount.name}`}
            disabled={pendingAction === `delete-${discount.id}`}
            icon={<Trash2 size={17} />}
            onClick={() => onDelete(discount.id)}
            tone="danger"
          />
        </div>
      </TableCell>
    </tr>
  );
};

const ActionButton = ({
  ariaLabel,
  disabled,
  icon,
  onClick,
  tone = "default",
}: {
  ariaLabel: string;
  disabled: boolean;
  icon: ReactNode;
  onClick: () => void;
  tone?: "danger" | "default";
}) => {
  return (
    <button
      aria-label={ariaLabel}
      className={
        tone === "danger"
          ? "border-border text-error hover:bg-bg-hover inline-flex size-9 items-center justify-center rounded-lg border transition disabled:opacity-60"
          : "border-border hover:bg-bg-hover inline-flex size-9 items-center justify-center rounded-lg border transition disabled:opacity-60"
      }
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {icon}
    </button>
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

interface FilterSelectProps {
  children: ReactNode;
  defaultValue: string;
  label: string;
  name: string;
}

const FilterSelect = ({ children, defaultValue, label, name }: FilterSelectProps) => {
  return (
    <label>
      <span className="mb-2 block text-sm font-bold">{label}</span>
      <select
        className="border-border focus:border-accent-primary bg-bg-primary h-11 w-full rounded-lg border px-3 text-sm transition outline-none"
        defaultValue={defaultValue}
        name={name}
      >
        {children}
      </select>
    </label>
  );
};

const StatusPill = ({
  active,
  falseLabel,
  trueLabel,
}: {
  active: boolean;
  falseLabel: string;
  trueLabel: string;
}) => {
  return (
    <span
      className={
        active
          ? "text-success inline-flex rounded-lg bg-green-50 px-2.5 py-1 text-xs font-bold"
          : "text-error inline-flex rounded-lg bg-red-50 px-2.5 py-1 text-xs font-bold"
      }
    >
      {active ? trueLabel : falseLabel}
    </span>
  );
};

const Pagination = ({
  discounts,
  filters,
}: {
  discounts: AdminDiscountListResponse;
  filters: AdminDiscountFilters;
}) => {
  const previousPage = Math.max(discounts.page - 1, 1);
  const nextPage = Math.min(discounts.page + 1, discounts.pages || 1);

  return (
    <div className="border-border flex flex-wrap items-center justify-between gap-3 border-t p-4">
      <p className="text-text-secondary text-sm">
        {discounts.total > 0
          ? `${(discounts.page - 1) * discounts.limit + 1}-${Math.min(
              discounts.page * discounts.limit,
              discounts.total,
            )} из ${discounts.total}`
          : "0 из 0"}
      </p>
      <div className="flex gap-2">
        <PaginationLink
          disabled={discounts.page <= 1}
          href={createDiscountsHref(filters, previousPage)}
          label="Назад"
        />
        <PaginationLink
          disabled={discounts.page >= discounts.pages}
          href={createDiscountsHref(filters, nextPage)}
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

const Alert = ({ children, tone }: { children: ReactNode; tone: "error" | "success" }) => {
  return (
    <div
      className={
        tone === "success"
          ? "border-border bg-bg-primary text-success rounded-lg border p-4 text-sm font-bold"
          : "border-border bg-bg-primary text-error rounded-lg border p-4 text-sm font-bold"
      }
    >
      {children}
    </div>
  );
};

const TableHeader = ({ children }: { children?: ReactNode }) => {
  return <th className="px-4 py-3 font-bold">{children}</th>;
};

const TableCell = ({ children }: { children: ReactNode }) => {
  return <td className="px-4 py-4 text-sm">{children}</td>;
};

const createDiscountsHref = (filters: AdminDiscountFilters, page: number): string => {
  const params = new URLSearchParams();

  Object.entries({ ...filters, page: String(page) }).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const query = params.toString();

  return query ? `${ROUTES.ADMIN_DISCOUNTS}?${query}` : ROUTES.ADMIN_DISCOUNTS;
};

const getTargetTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    cart: "Корзина",
    category: "Категория",
    product: "Товар",
  };

  return labels[type] ?? type;
};

const formatDiscountValue = (discountType: string, value: string): string => {
  if (discountType === "percent") {
    return `${value}%`;
  }

  return `${value} ₽`;
};

const formatNullableDate = (value?: string | null): string => {
  return value ? formatDate(value) : "-";
};

const formatDate = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};
