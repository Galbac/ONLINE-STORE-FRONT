import { adminApiClient, API_ENDPOINTS } from "@/shared/api";
import type { AdminOrderListParams, AdminOrderListResponse } from "../types";

type QueryParams = Record<string, string | number | boolean | null | undefined>;

export const adminOrderApi = {
  getList: async (
    params: AdminOrderListParams,
    accessToken?: string | null,
  ): Promise<AdminOrderListResponse> => {
    return adminApiClient.get<AdminOrderListResponse>(
      API_ENDPOINTS.ADMIN.ORDERS,
      toQueryParams(params),
      accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    );
  },
};

const toQueryParams = (params: AdminOrderListParams): QueryParams => {
  return {
    date_from: params.date_from,
    date_to: params.date_to,
    delivery_type: params.delivery_type,
    limit: params.limit,
    max_amount: params.max_amount,
    min_amount: params.min_amount,
    page: params.page,
    payment_method: params.payment_method,
    payment_status: params.payment_status,
    q: params.q,
    status: params.status,
    sync_status: params.sync_status,
  };
};
