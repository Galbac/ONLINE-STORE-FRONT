import { adminApiClient, API_ENDPOINTS } from "@/shared/api";
import type {
  AdminHealthCheckKey,
  AdminHealthCheckResult,
  AdminSystemHealthResponse,
  HealthDbResponse,
  HealthOneCResponse,
  HealthResponse,
  HealthStorageResponse,
  RootHealthResponse,
} from "../types";

export const adminSystemHealthApi = {
  getAll: async (accessToken?: string | null): Promise<AdminSystemHealthResponse> => {
    const [api, root, database, storage, oneC] = await Promise.all([
      measureHealthCheck("api", () => getApiHealth(accessToken), getGenericStatus),
      measureHealthCheck("root", () => getRootHealth(accessToken), getRootStatus),
      measureHealthCheck("database", () => getDbHealth(accessToken), getGenericStatus),
      measureHealthCheck("storage", () => getStorageHealth(accessToken), getStorageStatus),
      measureHealthCheck("one_c", () => getOneCHealth(accessToken), getOneCStatus),
    ]);

    return {
      api,
      database,
      one_c: oneC,
      root,
      storage,
    };
  },
};

const getApiHealth = async (accessToken?: string | null): Promise<HealthResponse> => {
  return adminApiClient.get<HealthResponse>(
    API_ENDPOINTS.HEALTH.API,
    undefined,
    getAuthHeaders(accessToken),
  );
};

const getRootHealth = async (accessToken?: string | null): Promise<RootHealthResponse> => {
  return adminApiClient.get<RootHealthResponse>(
    API_ENDPOINTS.HEALTH.ROOT,
    undefined,
    getAuthHeaders(accessToken),
  );
};

const getDbHealth = async (accessToken?: string | null): Promise<HealthDbResponse> => {
  return adminApiClient.get<HealthDbResponse>(
    API_ENDPOINTS.HEALTH.DB,
    undefined,
    getAuthHeaders(accessToken),
  );
};

const getStorageHealth = async (accessToken?: string | null): Promise<HealthStorageResponse> => {
  return adminApiClient.get<HealthStorageResponse>(
    API_ENDPOINTS.HEALTH.STORAGE,
    undefined,
    getAuthHeaders(accessToken),
  );
};

const getOneCHealth = async (accessToken?: string | null): Promise<HealthOneCResponse> => {
  return adminApiClient.get<HealthOneCResponse>(
    API_ENDPOINTS.HEALTH.ONE_C,
    undefined,
    getAuthHeaders(accessToken),
  );
};

const measureHealthCheck = async <TData>(
  key: AdminHealthCheckKey,
  request: () => Promise<TData>,
  getStatus: (data: TData) => AdminHealthCheckResult<TData>["status"],
): Promise<AdminHealthCheckResult<TData>> => {
  const startedAt = Date.now();

  try {
    const data = await request();

    return {
      data,
      key,
      responseTimeMs: Date.now() - startedAt,
      status: getStatus(data),
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Health check failed",
      key,
      responseTimeMs: Date.now() - startedAt,
      status: "down",
    };
  }
};

const getGenericStatus = (data: { status: string }): "down" | "ok" | "warning" => {
  const normalizedStatus = data.status.toLowerCase();

  if (normalizedStatus === "ok" || normalizedStatus === "healthy") {
    return "ok";
  }

  if (normalizedStatus === "degraded" || normalizedStatus === "warning") {
    return "warning";
  }

  return "down";
};

const getRootStatus = (data: RootHealthResponse): "down" | "ok" | "warning" => {
  const status = data.status?.toLowerCase();
  return status === "ok" || status === "healthy" ? "ok" : "warning";
};

const getStorageStatus = (data: HealthStorageResponse): "down" | "ok" | "warning" => {
  if (data.available === false || data.readable === false || data.writable === false) {
    return "down";
  }

  return getGenericStatus(data);
};

const getOneCStatus = (data: HealthOneCResponse): "down" | "ok" | "warning" => {
  if (!data.enabled) {
    return "warning";
  }

  if (!data.available) {
    return "down";
  }

  return getGenericStatus(data);
};

const getAuthHeaders = (accessToken?: string | null): HeadersInit | undefined => {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
};
