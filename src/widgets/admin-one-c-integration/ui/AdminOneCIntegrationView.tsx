"use client";

import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Play,
  RefreshCw,
  XCircle,
} from "lucide-react";
import {
  adminOneCApi,
  type AdminOneCOrderSyncResponse,
  type AdminOneCStatusResponse,
  type AdminOneCSyncKind,
  type AdminOneCSyncResponse,
  type HealthOneCResponse,
} from "@/entities/admin-integration";
import { getStoredAdminAccessToken } from "@/shared/api";

interface AdminOneCIntegrationViewProps {
  health: HealthOneCResponse | null;
  status: AdminOneCStatusResponse | null;
}

type SyncResult =
  | {
      kind: Exclude<AdminOneCSyncKind, "orders">;
      response: AdminOneCSyncResponse;
    }
  | {
      kind: "orders";
      response: AdminOneCOrderSyncResponse;
    };

const syncActions: Array<{
  kind: Exclude<AdminOneCSyncKind, "orders">;
  label: string;
}> = [
  { kind: "products", label: "Синхронизировать товары" },
  { kind: "prices", label: "Синхронизировать цены" },
  { kind: "stocks", label: "Синхронизировать остатки" },
];

export const AdminOneCIntegrationView = ({
  health: initialHealth,
  status: initialStatus,
}: AdminOneCIntegrationViewProps) => {
  const [status, setStatus] = useState(initialStatus);
  const [health, setHealth] = useState(initialHealth);
  const [fullSync, setFullSync] = useState(false);
  const [orderLimit, setOrderLimit] = useState("50");
  const [onlyErrors, setOnlyErrors] = useState(false);
  const [pendingAction, setPendingAction] = useState<AdminOneCSyncKind | "refresh" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const isBusy = isPending || pendingAction !== null;

  const refreshState = async (): Promise<void> => {
    const accessToken = getStoredAdminAccessToken();
    const [nextStatus, nextHealth] = await Promise.allSettled([
      adminOneCApi.getStatus(accessToken),
      adminOneCApi.getHealth(accessToken),
    ]);

    if (nextStatus.status === "fulfilled") {
      setStatus(nextStatus.value);
    }

    if (nextHealth.status === "fulfilled") {
      setHealth(nextHealth.value);
    }
  };

  const handleRefresh = (): void => {
    startTransition(async () => {
      try {
        setPendingAction("refresh");
        setError(null);
        await refreshState();
        setMessage("Статус 1С обновлён.");
      } catch {
        setMessage(null);
        setError("Не удалось обновить статус 1С.");
      } finally {
        setPendingAction(null);
      }
    });
  };

  const handleSync = (kind: Exclude<AdminOneCSyncKind, "orders">): void => {
    startTransition(async () => {
      try {
        setPendingAction(kind);
        setError(null);
        setMessage(null);
        const response = await adminOneCApi.sync(
          kind,
          { full_sync: fullSync },
          getStoredAdminAccessToken(),
        );

        setSyncResult({ kind, response });
        setMessage(response.message ?? `Задача #${response.job_id} запущена.`);
        await refreshState();
      } catch {
        setSyncResult(null);
        setError("Не удалось запустить синхронизацию. Проверьте доступность 1С или права.");
      } finally {
        setPendingAction(null);
      }
    });
  };

  const handleOrdersSync = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const parsedLimit = Number(orderLimit);

    if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 200) {
      setError("Лимит заказов должен быть от 1 до 200.");
      return;
    }

    startTransition(async () => {
      try {
        setPendingAction("orders");
        setError(null);
        setMessage(null);
        const response = await adminOneCApi.syncOrders(
          {
            limit: parsedLimit,
            only_errors: onlyErrors,
          },
          getStoredAdminAccessToken(),
        );

        setSyncResult({ kind: "orders", response });
        setMessage(
          `Заказы обработаны: ${response.processed}. Синхронизировано: ${response.synced}.`,
        );
        await refreshState();
      } catch {
        setSyncResult(null);
        setError("Не удалось синхронизировать заказы. Проверьте доступность 1С или права.");
      } finally {
        setPendingAction(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-text-primary text-2xl font-bold sm:text-3xl">Интеграция с 1С</h1>
          <p className="text-text-secondary mt-2">
            Статус обмена, доступность сервиса и ручной запуск синхронизаций.
          </p>
        </div>
        <button
          className="border-border hover:bg-bg-hover inline-flex h-11 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-bold transition disabled:opacity-60"
          disabled={isBusy}
          onClick={handleRefresh}
          type="button"
        >
          <RefreshCw size={16} />
          Обновить
        </button>
      </section>

      {message ? <Alert tone="success">{message}</Alert> : null}
      {error ? <Alert tone="error">{error}</Alert> : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Статус интеграции"
          tone={getStatusTone(status?.status)}
          value={status ? getStatusLabel(status.status) : "Нет данных"}
        />
        <SummaryCard
          label="Доступность 1С"
          tone={status?.available ? "success" : "error"}
          value={status?.available ? "Доступна" : "Недоступна"}
        />
        <SummaryCard
          label="Последний успешный обмен"
          value={formatDateTime(status?.last_success_sync_at)}
        />
        <SummaryCard label="Активные задачи" value={String(status?.active_jobs_count ?? 0)} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.65fr)]">
        <article className="border-border bg-bg-primary shadow-soft rounded-lg border p-5">
          <SectionTitle icon={<Database size={18} />} title="Состояние подключения" />
          <dl className="mt-5 grid gap-4 sm:grid-cols-[210px_minmax(0,1fr)]">
            <InfoRow label="Интеграция" value={status?.enabled ? "Включена" : "Отключена"} />
            <InfoRow
              label="API URL"
              value={status?.api_url_configured ? "Настроен" : "Не настроен"}
            />
            <InfoRow label="Health status" value={health?.status ?? "Нет данных"} />
            <InfoRow label="Health available" value={health?.available ? "Да" : "Нет"} />
            <InfoRow label="Latency" value={formatLatency(health?.latency_ms)} />
            <InfoRow label="Health message" value={health?.message ?? "Нет сообщения"} />
          </dl>
        </article>

        <article className="border-border bg-bg-primary shadow-soft rounded-lg border p-5">
          <SectionTitle icon={<AlertTriangle size={18} />} title="Последние ошибки" />
          {status?.last_error_message ? (
            <div className="mt-5 space-y-3">
              <p className="text-error text-sm font-bold">{status.last_error_message}</p>
              <p className="text-text-secondary text-sm">{formatDateTime(status.last_error_at)}</p>
            </div>
          ) : (
            <p className="text-text-secondary mt-5 text-sm">Ошибок обмена нет.</p>
          )}
        </article>
      </section>

      <section className="border-border bg-bg-primary shadow-soft rounded-lg border p-5">
        <SectionTitle icon={<Clock size={18} />} title="Последние обмены" />
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SmallMetric label="Товары" value={formatDateTime(status?.last_products_sync_at)} />
          <SmallMetric label="Цены" value={formatDateTime(status?.last_prices_sync_at)} />
          <SmallMetric label="Остатки" value={formatDateTime(status?.last_stocks_sync_at)} />
          <SmallMetric label="Заказы" value={formatDateTime(status?.last_orders_sync_at)} />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.65fr)]">
        <article className="border-border bg-bg-primary shadow-soft rounded-lg border p-5">
          <SectionTitle icon={<Play size={18} />} title="Синхронизация каталога" />
          <label className="mt-5 flex items-center gap-3 text-sm font-bold">
            <input
              checked={fullSync}
              className="accent-accent-primary size-4"
              onChange={(event) => setFullSync(event.target.checked)}
              type="checkbox"
            />
            Полная синхронизация
          </label>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {syncActions.map((action) => (
              <SyncButton
                disabled={isBusy}
                isPending={pendingAction === action.kind}
                key={action.kind}
                label={action.label}
                onClick={() => handleSync(action.kind)}
              />
            ))}
          </div>
        </article>

        <article className="border-border bg-bg-primary shadow-soft rounded-lg border p-5">
          <SectionTitle icon={<Play size={18} />} title="Синхронизация заказов" />
          <form className="mt-5 space-y-4" onSubmit={handleOrdersSync}>
            <label className="block">
              <span className="mb-2 block text-sm font-bold">Лимит заказов</span>
              <input
                className="border-border focus:border-accent-primary bg-bg-primary h-11 w-full rounded-lg border px-3 text-sm transition outline-none"
                max="200"
                min="1"
                onChange={(event) => setOrderLimit(event.target.value)}
                required
                type="number"
                value={orderLimit}
              />
            </label>
            <label className="flex items-center gap-3 text-sm font-bold">
              <input
                checked={onlyErrors}
                className="accent-accent-primary size-4"
                onChange={(event) => setOnlyErrors(event.target.checked)}
                type="checkbox"
              />
              Только ошибки
            </label>
            <SyncButton
              disabled={isBusy}
              isPending={pendingAction === "orders"}
              label="Синхронизировать заказы"
              type="submit"
            />
          </form>
        </article>
      </section>

      {syncResult ? <SyncResultPanel result={syncResult} /> : null}
    </div>
  );
};

const SyncButton = ({
  disabled,
  isPending,
  label,
  onClick,
  type = "button",
}: {
  disabled: boolean;
  isPending: boolean;
  label: string;
  onClick?: () => void;
  type?: "button" | "submit";
}) => (
  <button
    className="bg-accent-primary text-accent-contrast hover:bg-accent-hover inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-bold transition disabled:opacity-60"
    disabled={disabled}
    onClick={onClick}
    type={type}
  >
    <Play size={16} />
    {isPending ? "Запуск..." : label}
  </button>
);

const SyncResultPanel = ({ result }: { result: SyncResult }) => (
  <section className="border-border bg-bg-primary shadow-soft rounded-lg border p-5">
    <SectionTitle icon={<CheckCircle2 size={18} />} title="Результат запуска" />
    <dl className="mt-5 grid gap-4 sm:grid-cols-[160px_minmax(0,1fr)]">
      <InfoRow label="Тип" value={getSyncKindLabel(result.kind)} />
      <InfoRow label="Job ID" value={String(result.response.job_id)} />
      <InfoRow label="Статус" value={result.response.status} />
      {"processed" in result.response ? (
        <>
          <InfoRow label="Обработано" value={String(result.response.processed)} />
          <InfoRow label="Синхронизировано" value={String(result.response.synced)} />
          <InfoRow label="Ошибки" value={String(result.response.errors)} />
        </>
      ) : (
        <>
          <InfoRow label="Создано" value={formatNullableNumber(result.response.created)} />
          <InfoRow label="Обновлено" value={formatNullableNumber(result.response.updated)} />
          <InfoRow label="Сообщение" value={result.response.message ?? "Нет сообщения"} />
          <InfoRow label="Ошибки" value={String(result.response.errors?.length ?? 0)} />
        </>
      )}
    </dl>
  </section>
);

const SectionTitle = ({ icon, title }: { icon: ReactNode; title: string }) => (
  <div className="flex items-center gap-3">
    <span className="bg-bg-secondary text-accent-primary grid size-10 place-items-center rounded-lg">
      {icon}
    </span>
    <h2 className="text-text-primary text-lg font-bold">{title}</h2>
  </div>
);

const SummaryCard = ({
  label,
  tone,
  value,
}: {
  label: string;
  tone?: "error" | "success" | "warning";
  value: string;
}) => (
  <article className="border-border bg-bg-primary shadow-soft rounded-lg border p-5">
    <div className="flex items-center justify-between gap-3">
      <p className="text-text-secondary text-sm">{label}</p>
      {tone ? <StatusIcon tone={tone} /> : null}
    </div>
    <p className="text-text-primary mt-2 text-xl font-bold break-words">{value}</p>
  </article>
);

const StatusIcon = ({ tone }: { tone: "error" | "success" | "warning" }) => {
  if (tone === "success") {
    return <CheckCircle2 className="text-success shrink-0" size={18} />;
  }

  if (tone === "warning") {
    return <AlertTriangle className="text-warning shrink-0" size={18} />;
  }

  return <XCircle className="text-error shrink-0" size={18} />;
};

const SmallMetric = ({ label, value }: { label: string; value: string }) => (
  <div className="border-border bg-bg-secondary rounded-lg border p-4">
    <p className="text-text-secondary text-sm">{label}</p>
    <p className="text-text-primary mt-2 text-sm font-bold break-words">{value}</p>
  </div>
);

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <>
    <dt className="text-text-secondary text-sm">{label}</dt>
    <dd className="text-text-primary min-w-0 text-sm font-bold break-words">{value}</dd>
  </>
);

const Alert = ({ children, tone }: { children: ReactNode; tone: "error" | "success" }) => (
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

const getStatusTone = (status?: string): "error" | "success" | "warning" => {
  if (status === "ok") {
    return "success";
  }

  if (status === "disabled") {
    return "warning";
  }

  return "error";
};

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    disabled: "Отключена",
    error: "Ошибка",
    ok: "Работает",
  };

  return labels[status] ?? status;
};

const getSyncKindLabel = (kind: AdminOneCSyncKind): string => {
  const labels: Record<AdminOneCSyncKind, string> = {
    orders: "Заказы",
    prices: "Цены",
    products: "Товары",
    stocks: "Остатки",
  };

  return labels[kind];
};

const formatDateTime = (value?: string | null): string => {
  if (!value) {
    return "Нет данных";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const formatLatency = (value?: number | null): string => {
  return typeof value === "number" ? `${value} мс` : "Нет данных";
};

const formatNullableNumber = (value?: number | null): string => {
  return typeof value === "number" ? String(value) : "Нет данных";
};
