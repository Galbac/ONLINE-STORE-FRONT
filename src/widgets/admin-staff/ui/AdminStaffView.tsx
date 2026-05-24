import type { ReactNode } from "react";
import Link from "next/link";
import { Eye, Plus, Search } from "lucide-react";
import type {
  AdminRoleResponse,
  AdminStaffListItemResponse,
  AdminStaffListResponse,
} from "@/entities/admin-staff";
import { ROUTES } from "@/shared/config";

export interface AdminStaffFilters {
  is_active: string;
  page: string;
  q: string;
  role: string;
}

interface AdminStaffViewProps {
  filters: AdminStaffFilters;
  roles: AdminRoleResponse[];
  staff: AdminStaffListResponse;
}

export const AdminStaffView = ({ filters, roles, staff }: AdminStaffViewProps) => {
  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-text-primary text-2xl font-bold sm:text-3xl">Сотрудники</h1>
          <p className="text-text-secondary mt-2">
            Администраторы, менеджеры, сборщики, курьеры и доступы по ролям.
          </p>
        </div>
        <Link
          className="bg-accent-primary text-accent-contrast hover:bg-accent-hover inline-flex h-11 items-center gap-2 rounded-lg px-4 text-sm font-bold transition"
          href={ROUTES.ADMIN_STAFF_CREATE}
        >
          <Plus size={18} />
          Создать
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Всего найдено" value={staff.total.toLocaleString("ru-RU")} />
        <SummaryCard label="На странице" value={staff.items.length.toLocaleString("ru-RU")} />
        <SummaryCard label="Ролей" value={roles.length.toLocaleString("ru-RU")} />
      </section>

      <StaffFilters filters={filters} roles={roles} />

      <section className="border-border bg-bg-primary shadow-soft overflow-hidden rounded-lg border">
        <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <div>
            <h2 className="text-text-primary font-bold">Список сотрудников</h2>
            <p className="text-text-secondary mt-1 text-sm">
              Страница {staff.page} из {staff.pages || 1}
            </p>
          </div>
          <span className="text-text-secondary text-sm font-bold">
            {staff.items.length} из {staff.total}
          </span>
        </div>

        {staff.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead className="bg-bg-secondary text-text-muted text-xs uppercase">
                <tr>
                  <TableHeader>Сотрудник</TableHeader>
                  <TableHeader>Контакты</TableHeader>
                  <TableHeader>Роль</TableHeader>
                  <TableHeader>Активность</TableHeader>
                  <TableHeader>Блокировка</TableHeader>
                  <TableHeader>Создан</TableHeader>
                  <TableHeader />
                </tr>
              </thead>
              <tbody>
                {staff.items.map((staffItem) => (
                  <StaffRow key={staffItem.id} roles={roles} staffItem={staffItem} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-text-secondary p-5">По выбранным фильтрам сотрудники не найдены.</p>
        )}

        <Pagination filters={filters} staff={staff} />
      </section>
    </div>
  );
};

const StaffFilters = ({
  filters,
  roles,
}: {
  filters: AdminStaffFilters;
  roles: AdminRoleResponse[];
}) => {
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
              placeholder="Имя, телефон, email"
              type="search"
            />
          </span>
        </label>

        <FilterSelect defaultValue={filters.role} label="Роль" name="role">
          <option value="">Все роли</option>
          {roles.map((role) => (
            <option key={role.code} value={role.code}>
              {role.name}
            </option>
          ))}
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
          href={ROUTES.ADMIN_STAFF}
        >
          Сбросить
        </Link>
      </div>
    </form>
  );
};

const StaffRow = ({
  roles,
  staffItem,
}: {
  roles: AdminRoleResponse[];
  staffItem: AdminStaffListItemResponse;
}) => {
  return (
    <tr className="border-border border-t align-top">
      <TableCell>
        <Link
          className="hover:text-accent-primary block max-w-[240px] truncate font-bold transition"
          href={ROUTES.ADMIN_STAFF_DETAILS(staffItem.id)}
        >
          {staffItem.name}
        </Link>
        <p className="text-text-muted mt-1 text-xs">ID: {staffItem.id}</p>
      </TableCell>
      <TableCell>
        <p className="text-text-primary font-bold">{staffItem.phone}</p>
        <p className="text-text-muted mt-1 text-xs">{staffItem.email ?? "-"}</p>
      </TableCell>
      <TableCell>{getRoleName(roles, staffItem.role)}</TableCell>
      <TableCell>
        <StatusPill active={staffItem.is_active} falseLabel="Неактивен" trueLabel="Активен" />
      </TableCell>
      <TableCell>
        <StatusPill
          active={!staffItem.is_blocked}
          falseLabel="Заблокирован"
          trueLabel="Не заблокирован"
        />
      </TableCell>
      <TableCell>{formatDate(staffItem.created_at)}</TableCell>
      <TableCell>
        <Link
          aria-label={`Открыть сотрудника ${staffItem.name}`}
          className="border-border hover:bg-bg-hover inline-flex size-9 items-center justify-center rounded-lg border transition"
          href={ROUTES.ADMIN_STAFF_DETAILS(staffItem.id)}
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
  staff,
}: {
  filters: AdminStaffFilters;
  staff: AdminStaffListResponse;
}) => {
  const previousPage = Math.max(staff.page - 1, 1);
  const nextPage = Math.min(staff.page + 1, staff.pages || 1);

  return (
    <div className="border-border flex flex-wrap items-center justify-between gap-3 border-t p-4">
      <p className="text-text-secondary text-sm">
        {staff.total > 0
          ? `${(staff.page - 1) * staff.limit + 1}-${Math.min(
              staff.page * staff.limit,
              staff.total,
            )} из ${staff.total}`
          : "0 из 0"}
      </p>
      <div className="flex gap-2">
        <PaginationLink
          disabled={staff.page <= 1}
          href={createStaffHref(filters, previousPage)}
          label="Назад"
        />
        <PaginationLink
          disabled={staff.page >= staff.pages}
          href={createStaffHref(filters, nextPage)}
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

const createStaffHref = (filters: AdminStaffFilters, page: number): string => {
  const params = new URLSearchParams();

  Object.entries({ ...filters, page: String(page) }).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const query = params.toString();

  return query ? `${ROUTES.ADMIN_STAFF}?${query}` : ROUTES.ADMIN_STAFF;
};

const getRoleName = (roles: AdminRoleResponse[], code: string): string => {
  return roles.find((role) => role.code === code)?.name ?? code;
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
