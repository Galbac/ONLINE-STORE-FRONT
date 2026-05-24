export interface HealthResponse {
  environment?: string | null;
  service: string;
  status: string;
  version?: string | null;
}

export type RootHealthResponse = Record<string, string>;

export interface HealthDbResponse {
  database: string;
  latency_ms?: number | null;
  message?: string | null;
  status: string;
}

export interface HealthStorageResponse {
  available?: boolean | null;
  latency_ms?: number | null;
  message?: string | null;
  readable?: boolean | null;
  status: string;
  storage_type: string;
  writable?: boolean | null;
}

export interface HealthOneCResponse {
  available: boolean;
  enabled: boolean;
  latency_ms?: number | null;
  message?: string | null;
  status: string;
}

export type AdminHealthCheckKey = "api" | "database" | "one_c" | "root" | "storage";

export interface AdminHealthCheckResult<TData> {
  data: TData | null;
  error?: string;
  key: AdminHealthCheckKey;
  responseTimeMs: number;
  status: "down" | "ok" | "warning";
}

export interface AdminSystemHealthResponse {
  api: AdminHealthCheckResult<HealthResponse>;
  database: AdminHealthCheckResult<HealthDbResponse>;
  one_c: AdminHealthCheckResult<HealthOneCResponse>;
  root: AdminHealthCheckResult<RootHealthResponse>;
  storage: AdminHealthCheckResult<HealthStorageResponse>;
}
