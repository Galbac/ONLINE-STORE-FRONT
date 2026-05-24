import { adminApiClient, API_ENDPOINTS } from "@/shared/api";
import type {
  AdminOneCOrderSyncRequest,
  AdminOneCOrderSyncResponse,
  AdminOneCStatusResponse,
  AdminOneCSyncKind,
  AdminOneCSyncRequest,
  AdminOneCSyncResponse,
  HealthOneCResponse,
} from "../types";

export const adminOneCApi = {
  getHealth: async (accessToken?: string | null): Promise<HealthOneCResponse> => {
    return adminApiClient.get<HealthOneCResponse>(
      API_ENDPOINTS.HEALTH.ONE_C,
      undefined,
      getAuthHeaders(accessToken),
    );
  },

  getStatus: async (accessToken?: string | null): Promise<AdminOneCStatusResponse> => {
    return adminApiClient.get<AdminOneCStatusResponse>(
      API_ENDPOINTS.ADMIN.INTEGRATION_1C_STATUS,
      undefined,
      getAuthHeaders(accessToken),
    );
  },

  sync: async (
    kind: Exclude<AdminOneCSyncKind, "orders">,
    data: AdminOneCSyncRequest,
    accessToken?: string | null,
  ): Promise<AdminOneCSyncResponse> => {
    return adminApiClient.post<AdminOneCSyncRequest, AdminOneCSyncResponse>(
      getSyncEndpoint(kind),
      data,
      getAuthHeaders(accessToken),
    );
  },

  syncOrders: async (
    data: AdminOneCOrderSyncRequest,
    accessToken?: string | null,
  ): Promise<AdminOneCOrderSyncResponse> => {
    return adminApiClient.post<AdminOneCOrderSyncRequest, AdminOneCOrderSyncResponse>(
      API_ENDPOINTS.ADMIN.INTEGRATION_1C_SYNC_ORDERS,
      data,
      getAuthHeaders(accessToken),
    );
  },
};

const getSyncEndpoint = (kind: Exclude<AdminOneCSyncKind, "orders">): string => {
  const endpointByKind = {
    prices: API_ENDPOINTS.ADMIN.INTEGRATION_1C_SYNC_PRICES,
    products: API_ENDPOINTS.ADMIN.INTEGRATION_1C_SYNC_PRODUCTS,
    stocks: API_ENDPOINTS.ADMIN.INTEGRATION_1C_SYNC_STOCKS,
  } satisfies Record<Exclude<AdminOneCSyncKind, "orders">, string>;

  return endpointByKind[kind];
};

const getAuthHeaders = (accessToken?: string | null): HeadersInit | undefined => {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
};
