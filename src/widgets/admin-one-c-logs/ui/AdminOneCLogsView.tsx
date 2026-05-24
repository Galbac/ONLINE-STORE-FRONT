import type { ReactNode } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type {
  AdminOneCLogDirection,
  AdminOneCLogEntityType,
  AdminOneCLogItemResponse,
  AdminOneCLogsResponse,
  AdminOneCLogStatus,
} from "@/entities/admin-integration";
import { ROUTES } from "@/shared/config";

export interface AdminOneCLogFilters {
  date_from: string;
  date_to: string;
  direction: string;
  entity_type: string;
  page: string;
  q: string;
  status: string;
}

interface AdminOneCLogsViewProps {
  filters: AdminOneCLogFilters;
  logs: AdminOneCLogsResponse;
}

const directionOptions: Array<{ label: string; value: "" | AdminOneCLogDirection }> = [
  { label: "Все", value: "" },
  { label: "Входящие", value: "inbound" },
  { label: "Исходящие", value: "outbound" },
];

const entityTypeOptions: Array<{ label: string; value: "" | AdminOneCLogEntityType }> = [
  { label: "Все", value: "" },
  { label: "Категории", value: "categories" },
  { label: "Товары", value: "products" },
  { label: "Цены", value: "prices" },
  { label: "Остатки", value: "stocks" },
  { label: "Изображения", value: "images" },
  { label: "Заказы", value: "orders" },
];

const statusOptions: Array<{ label: string; value: "" | AdminOneCLogStatus }> = [
  { label: "Все", value: "" },
  { label: "Успешно", value: "success" },
  { label: "Частично", value: "partial" },
  { label: "Ошибка", value: "error" },
  { label: "Запущено", value: "started" },
];

export const AdminOneCLogsView = ({ filters, logs }: AdminOneCLogsViewProps) => {
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-text-primary text-2xl font-bold sm:text-3xl">Логи 1С</h1>
          <p className="text-text-secondary mt-2">
            История обмена, направления, сущности, статусы и ошибки синхронизации.
          </p>
        </div>
        <Link
          className="border-border hover:bg-bg-hover inline-flex h-11 items-center justify-center rounded-lg border px-4 text-sm font-bold transition"
          href={ROUTES.ADMIN_INTEGRATION_1C}
        >
          Статус 1С
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Всего найдено" value={logs.total.toLocaleString("ru-RU")} />
        <SummaryCard label="На странице" value={logs.items.length.toLocaleString("ru-RU")} />
        <SummaryCard label="Страниц" value={(logs.pages || 1).toLocaleString("ru-RU")} />
      </section>

      <LogsFilters filters={filters} />

      <section className="border-border bg-bg-primary shadow-soft overflow-hidden rounded-lg border">
        <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <div>
            <h2 className="text-text-primary font-bold">Таблица логов</h2>
            <p className="text-text-secondary mt-1 text-sm">
              Страница {logs.page} из {logs.pages || 1}
            </p>
          </div>
          <span className="text-text-secondary text-sm font-bold">
            {logs.items.length} из {logs.total}
          </span>
        </div>

        {logs.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] border-collapse text-left">
              <thead className="bg-bg-secondary text-text-muted text-xs uppercase">
                <tr>
                  <TableHeader>ID</TableHeader>
                  <TableHeader>Дата</TableHeader>
                  <TableHeader>Direction</TableHeader>
                  <TableHeader>Entity</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Создано</TableHeader>
                  <TableHeader>Обновлено</TableHeader>
                  <TableHeader>Ошибки</TableHeader>
                  <TableHeader>Сообщение</TableHeader>
                  <TableHeader>Payload</TableHeader>
                </tr>
              </thead>
              <tbody>
                {logs.items.map((log) => (
                  <LogRow key={log.id} log={log} />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-text-secondary p-5">По выбранным фильтрам логи не найдены.</p>
        )}

        <Pagination filters={filters} logs={logs} />
      </section>
    </div>
  );
};

const LogsFilters = ({ filters }: { filters: AdminOneCLogFilters }) => (
  <form className="border-border bg-bg-primary shadow-soft rounded-lg border p-4" method="get">
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
      <label className="md:col-span-2">
        <span className="mb-2 block text-sm font-bold">Поиск</span>
        <span className="border-border focus-within:border-accent-primary flex h-11 items-center gap-2 rounded-lg border px-3 transition">
          <Search className="text-text-muted shrink-0" size={18} />
          <input
            className="placeholder:text-text-muted min-w-0 flex-1 bg-transparent text-sm outline-none"
            defaultValue={filters.q}
            name="q"
            placeholder="Сообщение или ошибка"
            type="search"
          />
        </span>
      </label>

      <FilterSelect defaultValue={filters.direction} label="Direction" name="direction">
        {directionOptions.map((option) => (
          <option key={option.value || "all"} value={option.value}>
            {option.label}
          </option>
        ))}
      </FilterSelect>
      <FilterSelect defaultValue={filters.entity_type} label="Entity type" name="entity_type">
        {entityTypeOptions.map((option) => (
          <option key={option.value || "all"} value={option.value}>
            {option.label}
          </option>
        ))}
      </FilterSelect>
      <FilterSelect defaultValue={filters.status} label="Status" name="status">
        {statusOptions.map((option) => (
          <option key={option.value || "all"} value={option.value}>
            {option.label}
          </option>
        ))}
      </FilterSelect>
      <FilterInput defaultValue={filters.date_from} label="Дата от" name="date_from" />
      <FilterInput defaultValue={filters.date_to} label="Дата до" name="date_to" />
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
        href={ROUTES.ADMIN_INTEGRATION_1C_LOGS}
      >
        Сбросить
      </Link>
    </div>
  </form>
);

const LogRow = ({ log }: { log: AdminOneCLogItemResponse }) => (
  <tr className="border-border border-t align-top">
    <TableCell>
      <span className="font-bold">#{log.id}</span>
    </TableCell>
    <TableCell>{formatDateTime(log.created_at)}</TableCell>
    <TableCell>
      <TextPill>{getDirectionLabel(log.direction)}</TextPill>
    </TableCell>
    <TableCell>{getEntityTypeLabel(log.entity_type)}</TableCell>
    <TableCell>
      <StatusPill status={log.status}>{getStatusLabel(log.status)}</StatusPill>
    </TableCell>
    <TableCell>{log.created_count.toLocaleString("ru-RU")}</TableCell>
    <TableCell>{log.updated_count.toLocaleString("ru-RU")}</TableCell>
    <TableCell>
      <span className={log.error_count > 0 ? "text-error font-bold" : undefined}>
        {log.error_count.toLocaleString("ru-RU")}
      </span>
    </TableCell>
    <TableCell>
      <p className="max-w-[320px] whitespace-normal">{log.message ?? "-"}</p>
    </TableCell>
    <TableCell>
      <PayloadDetails label="Request" payload={log.request_payload} />
      <PayloadDetails label="Response" payload={log.response_payload} />
    </TableCell>
  </tr>
);

const PayloadDetails = ({
  label,
  payload,
}: {
  label: string;
  payload: Record<string, unknown> | null | undefined;
}) => {
  if (!payload) {
    return <p className="text-text-muted text-xs">{label}: -</p>;
  }

  return (
    <details className="max-w-[260px]">
      <summary className="hover:text-accent-primary cursor-pointer text-xs font-bold transition">
        {label}
      </summary>
      <pre className="border-border bg-bg-secondary mt-2 max-h-44 overflow-auto rounded-lg border p-3 text-xs whitespace-pre-wrap">
        {JSON.stringify(payload, null, 2)}
      </pre>
    </details>
  );
};

const Pagination = ({
  filters,
  logs,
}: {
  filters: AdminOneCLogFilters;
  logs: AdminOneCLogsResponse;
}) => {
  const previousPage = Math.max(logs.page - 1, 1);
  const nextPage = Math.min(logs.page + 1, logs.pages || 1);

  return (
    <div className="border-border flex flex-wrap items-center justify-between gap-3 border-t p-4">
      <p className="text-text-secondary text-sm">
        {logs.total > 0
          ? `${(logs.page - 1) * logs.limit + 1}-${Math.min(
              logs.page * logs.limit,
              logs.total,
            )} из ${logs.total}`
          : "0 из 0"}
      </p>
      <div className="flex gap-2">
        <PaginationLink
          disabled={logs.page <= 1}
          href={createLogsHref(filters, previousPage)}
          label="Назад"
        />
        <PaginationLink
          disabled={logs.page >= logs.pages}
          href={createLogsHref(filters, nextPage)}
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

const SummaryCard = ({ label, value }: { label: string; value: string }) => (
  <article className="border-border bg-bg-primary shadow-soft rounded-lg border p-5">
    <p className="text-text-secondary text-sm">{label}</p>
    <p className="text-text-primary mt-2 text-2xl font-bold">{value}</p>
  </article>
);

const FilterSelect = ({
  children,
  defaultValue,
  label,
  name,
}: {
  children: ReactNode;
  defaultValue: string;
  label: string;
  name: string;
}) => (
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

const FilterInput = ({
  defaultValue,
  label,
  name,
}: {
  defaultValue: string;
  label: string;
  name: string;
}) => (
  <label>
    <span className="mb-2 block text-sm font-bold">{label}</span>
    <input
      className="border-border focus:border-accent-primary bg-bg-primary h-11 w-full rounded-lg border px-3 text-sm transition outline-none"
      defaultValue={defaultValue}
      name={name}
      type="date"
    />
  </label>
);

const TableHeader = ({ children }: { children?: ReactNode }) => (
  <th className="px-4 py-3 font-bold">{children}</th>
);

const TableCell = ({ children }: { children: ReactNode }) => (
  <td className="px-4 py-4 text-sm">{children}</td>
);

const TextPill = ({ children }: { children: ReactNode }) => (
  <span className="bg-bg-secondary border-border text-text-primary inline-flex rounded-lg border px-2.5 py-1 text-xs font-bold">
    {children}
  </span>
);

const StatusPill = ({ children, status }: { children: ReactNode; status: AdminOneCLogStatus }) => {
  const classNameByStatus: Record<AdminOneCLogStatus, string> = {
    error: "text-error",
    partial: "text-warning",
    started: "text-text-secondary",
    success: "text-success",
  };

  return (
    <span
      className={`${classNameByStatus[status]} bg-bg-secondary border-border inline-flex rounded-lg border px-2.5 py-1 text-xs font-bold`}
    >
      {children}
    </span>
  );
};

const createLogsHref = (filters: AdminOneCLogFilters, page: number): string => {
  const params = new URLSearchParams();

  Object.entries({ ...filters, page: String(page) }).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const query = params.toString();

  return query ? `${ROUTES.ADMIN_INTEGRATION_1C_LOGS}?${query}` : ROUTES.ADMIN_INTEGRATION_1C_LOGS;
};

const formatDateTime = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const getDirectionLabel = (value: AdminOneCLogDirection): string => {
  return directionOptions.find((option) => option.value === value)?.label ?? value;
};

const getEntityTypeLabel = (value: AdminOneCLogEntityType): string => {
  return entityTypeOptions.find((option) => option.value === value)?.label ?? value;
};

const getStatusLabel = (value: AdminOneCLogStatus): string => {
  return statusOptions.find((option) => option.value === value)?.label ?? value;
};
