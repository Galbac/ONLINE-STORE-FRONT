import type { ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  HardDrive,
  Server,
  XCircle,
} from "lucide-react";
import type {
  AdminHealthCheckResult,
  AdminSystemHealthResponse,
  HealthDbResponse,
  HealthOneCResponse,
  HealthResponse,
  HealthStorageResponse,
  RootHealthResponse,
} from "@/entities/admin-system-health";

interface AdminSystemHealthViewProps {
  health: AdminSystemHealthResponse;
}

type HealthCheck =
  | AdminHealthCheckResult<HealthDbResponse>
  | AdminHealthCheckResult<HealthOneCResponse>
  | AdminHealthCheckResult<HealthResponse>
  | AdminHealthCheckResult<HealthStorageResponse>
  | AdminHealthCheckResult<RootHealthResponse>;

export const AdminSystemHealthView = ({ health }: AdminSystemHealthViewProps) => {
  const checks: HealthCheck[] = [
    health.api,
    health.root,
    health.database,
    health.storage,
    health.one_c,
  ];
  const warnings = getWarnings(checks);
  const averageResponseTime = getAverageResponseTime(checks);

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-text-primary text-2xl font-bold sm:text-3xl">Health / Monitoring</h1>
        <p className="text-text-secondary mt-2">
          Внутренний мониторинг API, базы данных, хранилища и интеграции с 1С.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="API" result={health.api} value={getApiTitle(health.api)} />
        <SummaryCard
          label="База данных"
          result={health.database}
          value={getDbTitle(health.database)}
        />
        <SummaryCard
          label="Хранилище"
          result={health.storage}
          value={getStorageTitle(health.storage)}
        />
        <SummaryCard label="1С" result={health.one_c} value={getOneCTitle(health.one_c)} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article className="border-border bg-bg-primary shadow-soft rounded-lg border p-5">
          <div className="flex items-center gap-3">
            <span className="bg-bg-secondary text-accent-primary grid size-10 place-items-center rounded-lg">
              <Clock size={18} />
            </span>
            <div>
              <h2 className="text-text-primary text-lg font-bold">Время ответа</h2>
              <p className="text-text-secondary text-sm">
                Замерено серверной страницей при загрузке.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {checks.map((check) => (
              <SmallMetric
                key={check.key}
                label={getCheckLabel(check)}
                value={`${check.responseTimeMs} мс`}
              />
            ))}
          </div>
        </article>

        <article className="border-border bg-bg-primary shadow-soft rounded-lg border p-5">
          <p className="text-text-secondary text-sm">Среднее время</p>
          <p className="text-text-primary mt-2 text-3xl font-bold">{averageResponseTime} мс</p>
        </article>
      </section>

      <section className="border-border bg-bg-primary shadow-soft rounded-lg border p-5">
        <h2 className="text-text-primary text-lg font-bold">Предупреждения</h2>
        {warnings.length > 0 ? (
          <div className="mt-4 space-y-3">
            {warnings.map((warning) => (
              <div
                className="border-border bg-bg-secondary flex items-start gap-3 rounded-lg border p-4 text-sm"
                key={warning}
              >
                <AlertTriangle className="text-warning mt-0.5 shrink-0" size={18} />
                <p className="text-text-primary">{warning}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-success mt-4 text-sm font-bold">Критичных предупреждений нет.</p>
        )}
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <DetailsCard icon={<Server size={18} />} result={health.api} title="API /api/health">
          <InfoRow label="service" value={health.api.data?.service ?? "-"} />
          <InfoRow label="version" value={health.api.data?.version ?? "-"} />
          <InfoRow label="environment" value={health.api.data?.environment ?? "-"} />
        </DetailsCard>

        <DetailsCard icon={<Server size={18} />} result={health.root} title="Root /health">
          {Object.entries(health.root.data ?? {}).map(([key, value]) => (
            <InfoRow key={key} label={key} value={value} />
          ))}
        </DetailsCard>

        <DetailsCard icon={<Database size={18} />} result={health.database} title="База данных">
          <InfoRow label="database" value={health.database.data?.database ?? "-"} />
          <InfoRow
            label="latency"
            value={formatNullableLatency(health.database.data?.latency_ms)}
          />
          <InfoRow label="message" value={health.database.data?.message ?? "-"} />
        </DetailsCard>

        <DetailsCard icon={<HardDrive size={18} />} result={health.storage} title="Хранилище">
          <InfoRow label="storage_type" value={health.storage.data?.storage_type ?? "-"} />
          <InfoRow
            label="available"
            value={formatNullableBoolean(health.storage.data?.available)}
          />
          <InfoRow label="readable" value={formatNullableBoolean(health.storage.data?.readable)} />
          <InfoRow label="writable" value={formatNullableBoolean(health.storage.data?.writable)} />
          <InfoRow label="latency" value={formatNullableLatency(health.storage.data?.latency_ms)} />
          <InfoRow label="message" value={health.storage.data?.message ?? "-"} />
        </DetailsCard>

        <DetailsCard icon={<Database size={18} />} result={health.one_c} title="1С">
          <InfoRow label="enabled" value={formatNullableBoolean(health.one_c.data?.enabled)} />
          <InfoRow label="available" value={formatNullableBoolean(health.one_c.data?.available)} />
          <InfoRow label="latency" value={formatNullableLatency(health.one_c.data?.latency_ms)} />
          <InfoRow label="message" value={health.one_c.data?.message ?? "-"} />
        </DetailsCard>
      </section>
    </div>
  );
};

const SummaryCard = ({
  label,
  result,
  value,
}: {
  label: string;
  result: HealthCheck;
  value: string;
}) => (
  <article className="border-border bg-bg-primary shadow-soft rounded-lg border p-5">
    <div className="flex items-start justify-between gap-3">
      <p className="text-text-secondary text-sm">{label}</p>
      <StatusIcon status={result.status} />
    </div>
    <p className="text-text-primary mt-2 text-xl font-bold break-words">{value}</p>
    <p className="text-text-muted mt-2 text-sm">{result.responseTimeMs} мс</p>
  </article>
);

const DetailsCard = ({
  children,
  icon,
  result,
  title,
}: {
  children: ReactNode;
  icon: ReactNode;
  result: HealthCheck;
  title: string;
}) => (
  <article className="border-border bg-bg-primary shadow-soft rounded-lg border p-5">
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="bg-bg-secondary text-accent-primary grid size-10 place-items-center rounded-lg">
          {icon}
        </span>
        <h2 className="text-text-primary text-lg font-bold">{title}</h2>
      </div>
      <StatusIcon status={result.status} />
    </div>
    <dl className="mt-5 grid gap-4 sm:grid-cols-[150px_minmax(0,1fr)]">
      <InfoRow label="status" value={getDataStatus(result.data)} />
      <InfoRow label="response_time" value={`${result.responseTimeMs} мс`} />
      {result.error ? <InfoRow label="error" value={result.error} /> : null}
      {children}
    </dl>
  </article>
);

const StatusIcon = ({ status }: { status: HealthCheck["status"] }) => {
  if (status === "ok") {
    return <CheckCircle2 className="text-success shrink-0" size={19} />;
  }

  if (status === "warning") {
    return <AlertTriangle className="text-warning shrink-0" size={19} />;
  }

  return <XCircle className="text-error shrink-0" size={19} />;
};

const SmallMetric = ({ label, value }: { label: string; value: string }) => (
  <div className="border-border bg-bg-secondary rounded-lg border p-4">
    <p className="text-text-secondary text-sm">{label}</p>
    <p className="text-text-primary mt-2 text-lg font-bold">{value}</p>
  </div>
);

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <>
    <dt className="text-text-secondary text-sm">{label}</dt>
    <dd className="text-text-primary min-w-0 text-sm font-bold break-words">{value}</dd>
  </>
);

const getWarnings = (checks: HealthCheck[]): string[] => {
  return checks.flatMap((check) => {
    const warnings: string[] = [];
    const label = getCheckLabel(check);

    if (check.status === "down") {
      warnings.push(`${label}: проверка недоступна или вернула критичный статус.`);
    }

    if (check.status === "warning") {
      warnings.push(`${label}: сервис работает с предупреждением.`);
    }

    if (check.responseTimeMs > 1000) {
      warnings.push(`${label}: время ответа выше 1000 мс.`);
    }

    if (check.error) {
      warnings.push(`${label}: ${check.error}`);
    }

    return warnings;
  });
};

const getAverageResponseTime = (checks: HealthCheck[]): number => {
  if (checks.length === 0) {
    return 0;
  }

  return Math.round(
    checks.reduce((total, check) => total + check.responseTimeMs, 0) / checks.length,
  );
};

const getCheckLabel = (check: HealthCheck): string => {
  const labels: Record<HealthCheck["key"], string> = {
    api: "API",
    database: "База",
    one_c: "1С",
    root: "Root",
    storage: "Storage",
  };

  return labels[check.key];
};

const getApiTitle = (check: AdminHealthCheckResult<HealthResponse>): string => {
  return check.data?.status ?? "Нет данных";
};

const getDbTitle = (check: AdminHealthCheckResult<HealthDbResponse>): string => {
  return check.data?.status ?? "Нет данных";
};

const getStorageTitle = (check: AdminHealthCheckResult<HealthStorageResponse>): string => {
  return check.data?.status ?? "Нет данных";
};

const getOneCTitle = (check: AdminHealthCheckResult<HealthOneCResponse>): string => {
  return check.data?.status ?? "Нет данных";
};

const getDataStatus = (data: HealthCheck["data"]): string => {
  if (!data) {
    return "Нет данных";
  }

  if ("status" in data && typeof data.status === "string") {
    return data.status;
  }

  return "ok";
};

const formatNullableLatency = (value?: number | null): string => {
  return typeof value === "number" ? `${value} мс` : "-";
};

const formatNullableBoolean = (value?: boolean | null): string => {
  if (value === true) {
    return "Да";
  }

  if (value === false) {
    return "Нет";
  }

  return "-";
};
