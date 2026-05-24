import type { ReactNode } from "react";
import Link from "next/link";
import { Eye, Plus, Search } from "lucide-react";
import type {
  AdminPromoCodeListItemResponse,
  AdminPromoCodeListResponse,
} from "@/entities/admin-promo-code";
import { ROUTES } from "@/shared/config";

export interface AdminPromoCodeFilters {
  is_active: string;
  page: string;
  q: string;
}

interface AdminPromoCodesViewProps {
  filters: AdminPromoCodeFilters;
  promoCodes: AdminPromoCodeListResponse;
}

export const AdminPromoCodesView = ({ filters, promoCodes }: AdminPromoCodesViewProps) => {
  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-text-primary text-2xl font-bold sm:text-3xl">Промокоды</h1>
          <p className="text-text-secondary mt-2">
            Коды, ограничения, лимиты использования и статистика применений.
          </p>
        </div>
        <Link
          className="bg-accent-primary text-accent-contrast hover:bg-accent-hover inline-flex h-11 items-center gap-2 rounded-lg px-4 text-sm font-bold transition"
          href={ROUTES.ADMIN_PROMO_CODE_CREATE}
        >
          <Plus size={18} />
          Создать
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Всего найдено" value={promoCodes.total.toLocaleString("ru-RU")} />
        <SummaryCard label="На странице" value={promoCodes.items.length.toLocaleString("ru-RU")} />
        <SummaryCard label="Страниц" value={(promoCodes.pages || 1).toLocaleString("ru-RU")} />
      </section>

      <PromoCodeFilters filters={filters} />

      <section className="border-border bg-bg-primary shadow-soft overflow-hidden rounded-lg border">
        <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <div>
            <h2 className="text-text-primary font-bold">Список промокодов</h2>
            <p className="text-text-secondary mt-1 text-sm">
              Страница {promoCodes.page} из {promoCodes.pages || 1}
            </p>
          </div>
          <span className="text-text-secondary text-sm font-bold">
            {promoCodes.items.length} из {promoCodes.total}
          </span>
        </div>

        {promoCodes.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] border-collapse text-left">
              <thead className="bg-bg-secondary text-text-muted text-xs uppercase">
                <tr>
                  <TableHeader>Код</TableHeader>
                  <TableHeader>Название</TableHeader>
                  <TableHeader>Скидка</TableHeader>
                  <TableHeader>Мин. заказ</TableHeader>
                  <TableHeader>Лимиты</TableHeader>
                  <TableHeader>Использований</TableHeader>
                  <TableHeader>Активность</TableHeader>
                  <TableHeader>Период</TableHeader>
                  <TableHeader />
                </tr>
              </thead>
              <tbody>
                {promoCodes.items.map((promoCode) => (
                  <PromoCodeRow key={promoCode.id} promoCode={promoCode} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-text-secondary p-5">По выбранным фильтрам промокоды не найдены.</p>
        )}

        <Pagination filters={filters} promoCodes={promoCodes} />
      </section>
    </div>
  );
};

const PromoCodeFilters = ({ filters }: { filters: AdminPromoCodeFilters }) => {
  return (
    <form className="border-border bg-bg-primary shadow-soft rounded-lg border p-4" method="get">
      <div className="grid gap-3 md:grid-cols-3">
        <label className="md:col-span-2">
          <span className="mb-2 block text-sm font-bold">Поиск</span>
          <span className="border-border focus-within:border-accent-primary flex h-11 items-center gap-2 rounded-lg border px-3 transition">
            <Search className="text-text-muted shrink-0" size={18} />
            <input
              className="placeholder:text-text-muted min-w-0 flex-1 bg-transparent text-sm outline-none"
              defaultValue={filters.q}
              name="q"
              placeholder="Код промокода"
              type="search"
            />
          </span>
        </label>

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
          href={ROUTES.ADMIN_PROMO_CODES}
        >
          Сбросить
        </Link>
      </div>
    </form>
  );
};

const PromoCodeRow = ({ promoCode }: { promoCode: AdminPromoCodeListItemResponse }) => {
  return (
    <tr className="border-border border-t align-top">
      <TableCell>
        <Link
          className="hover:text-accent-primary font-bold transition"
          href={ROUTES.ADMIN_PROMO_CODE_EDIT(promoCode.id)}
        >
          {promoCode.code}
        </Link>
        <p className="text-text-muted mt-1 text-xs">ID: {promoCode.id}</p>
      </TableCell>
      <TableCell>{promoCode.name ?? "-"}</TableCell>
      <TableCell>
        {formatDiscountValue(promoCode.discount_type, promoCode.discount_value)}
      </TableCell>
      <TableCell>{promoCode.min_order_amount ? `${promoCode.min_order_amount} ₽` : "-"}</TableCell>
      <TableCell>
        <p>Всего: {formatLimit(promoCode.usage_limit)}</p>
        <p className="text-text-muted mt-1 text-xs">
          На пользователя: {formatLimit(promoCode.user_usage_limit)}
        </p>
      </TableCell>
      <TableCell>{promoCode.usage_count.toLocaleString("ru-RU")}</TableCell>
      <TableCell>
        <StatusPill active={promoCode.is_active} falseLabel="Неактивен" trueLabel="Активен" />
      </TableCell>
      <TableCell>
        <p>{formatNullableDate(promoCode.starts_at)}</p>
        <p className="text-text-muted mt-1 text-xs">до {formatNullableDate(promoCode.ends_at)}</p>
      </TableCell>
      <TableCell>
        <Link
          aria-label={`Открыть промокод ${promoCode.code}`}
          className="border-border hover:bg-bg-hover inline-flex size-9 items-center justify-center rounded-lg border transition"
          href={ROUTES.ADMIN_PROMO_CODE_EDIT(promoCode.id)}
        >
          <Eye size={17} />
        </Link>
      </TableCell>
    </tr>
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
  filters,
  promoCodes,
}: {
  filters: AdminPromoCodeFilters;
  promoCodes: AdminPromoCodeListResponse;
}) => {
  const previousPage = Math.max(promoCodes.page - 1, 1);
  const nextPage = Math.min(promoCodes.page + 1, promoCodes.pages || 1);

  return (
    <div className="border-border flex flex-wrap items-center justify-between gap-3 border-t p-4">
      <p className="text-text-secondary text-sm">
        {promoCodes.total > 0
          ? `${(promoCodes.page - 1) * promoCodes.limit + 1}-${Math.min(
              promoCodes.page * promoCodes.limit,
              promoCodes.total,
            )} из ${promoCodes.total}`
          : "0 из 0"}
      </p>
      <div className="flex gap-2">
        <PaginationLink
          disabled={promoCodes.page <= 1}
          href={createPromoCodesHref(filters, previousPage)}
          label="Назад"
        />
        <PaginationLink
          disabled={promoCodes.page >= promoCodes.pages}
          href={createPromoCodesHref(filters, nextPage)}
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

const createPromoCodesHref = (filters: AdminPromoCodeFilters, page: number): string => {
  const params = new URLSearchParams();

  Object.entries({ ...filters, page: String(page) }).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const query = params.toString();

  return query ? `${ROUTES.ADMIN_PROMO_CODES}?${query}` : ROUTES.ADMIN_PROMO_CODES;
};

const formatLimit = (value?: number | null): string => {
  return value === null || value === undefined ? "без лимита" : value.toLocaleString("ru-RU");
};

const formatDiscountValue = (discountType: string, value: string): string => {
  return discountType === "percent" ? `${value}%` : `${value} ₽`;
};

const formatNullableDate = (value?: string | null): string => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};
