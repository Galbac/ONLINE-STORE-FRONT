export interface HealthOneCResponse {
  available: boolean;
  enabled: boolean;
  latency_ms?: number | null;
  message?: string | null;
  status: string;
}

export type AdminOneCStatus = "disabled" | "error" | "ok";

export interface AdminOneCStatusResponse {
  active_jobs_count: number;
  api_url_configured: boolean;
  available: boolean;
  enabled: boolean;
  last_error_at?: string | null;
  last_error_message?: string | null;
  last_orders_sync_at?: string | null;
  last_prices_sync_at?: string | null;
  last_products_sync_at?: string | null;
  last_stocks_sync_at?: string | null;
  last_success_sync_at?: string | null;
  status: AdminOneCStatus;
}

export interface AdminOneCSyncRequest {
  full_sync: boolean;
}

export interface AdminOneCOrderSyncRequest {
  limit: number;
  only_errors: boolean;
}

export interface OneCImportItemErrorResponse {
  external_1c_id?: string | null;
  field?: string | null;
  message: string;
  product_external_1c_id?: string | null;
}

export type AdminOneCSyncStatus = "error" | "started" | "success";

export interface AdminOneCSyncResponse {
  created?: number | null;
  errors?: OneCImportItemErrorResponse[] | null;
  job_id: number;
  message?: string | null;
  status: AdminOneCSyncStatus;
  updated?: number | null;
}

export interface AdminOneCOrderSyncResponse {
  errors: number;
  job_id: number;
  processed: number;
  status: "success";
  synced: number;
}

export type AdminOneCSyncKind = "orders" | "prices" | "products" | "stocks";
