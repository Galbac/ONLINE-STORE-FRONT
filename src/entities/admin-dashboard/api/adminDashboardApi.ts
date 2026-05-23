import { adminApiClient, API_ENDPOINTS } from "@/shared/api";

import type {
  AdminDashboardResponse,
  AdminDashboardSalesParams,
  AdminLowStockParams,
  AdminLowStockResponse,
  AdminSalesResponse,
} from "../types";

type QueryParams = Record<string, string | number | boolean | null | undefined>;

export const adminDashboardApi = {
  getSummary: async (accessToken?: string | null): Promise<AdminDashboardResponse> => {
    return adminApiClient.get<AdminDashboardResponse>(
      API_ENDPOINTS.ADMIN.DASHBOARD,
      undefined,
      accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    );
  },

  getSales: async (
    params: AdminDashboardSalesParams,
    accessToken?: string | null,
  ): Promise<AdminSalesResponse> => {
    return adminApiClient.get<AdminSalesResponse>(
      API_ENDPOINTS.ADMIN.DASHBOARD_SALES,
      toSalesQueryParams(params),
      accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    );
  },

  getLowStock: async (
    params: AdminLowStockParams,
    accessToken?: string | null,
  ): Promise<AdminLowStockResponse> => {
    return adminApiClient.get<AdminLowStockResponse>(
      API_ENDPOINTS.ADMIN.DASHBOARD_LOW_STOCK,
      toLowStockQueryParams(params),
      accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    );
  },
};

const toSalesQueryParams = (params: AdminDashboardSalesParams): QueryParams => {
  return {
    date_from: params.date_from,
    date_to: params.date_to,
    group_by: params.group_by,
  };
};

const toLowStockQueryParams = (params: AdminLowStockParams): QueryParams => {
  return {
    category_id: params.category_id,
    limit: params.limit,
    offset: params.offset,
  };
};
