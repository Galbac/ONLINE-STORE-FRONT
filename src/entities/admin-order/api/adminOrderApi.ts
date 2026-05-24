import { adminApiClient, API_ENDPOINTS } from "@/shared/api";
import type {
  AdminOrderActionResponse,
  AdminOrderDetailResponse,
  AdminOrderListParams,
  AdminOrderListResponse,
  AdminOrderPayload,
  AdminOrderPrintResponse,
  AdminOrderStatusResponse,
  AdminOrderSync1CResponse,
  AdminOrderUpdateResponse,
} from "../types";

type QueryParams = Record<string, string | number | boolean | null | undefined>;

export const adminOrderApi = {
  cancel: async (
    orderId: number,
    data: AdminOrderPayload,
    accessToken?: string | null,
  ): Promise<AdminOrderActionResponse> => {
    return adminApiClient.post<AdminOrderPayload, AdminOrderActionResponse>(
      API_ENDPOINTS.ADMIN.ORDER_CANCEL(orderId),
      data,
      getAuthHeaders(accessToken),
    );
  },

  confirm: async (
    orderId: number,
    data: AdminOrderPayload = {},
    accessToken?: string | null,
  ): Promise<AdminOrderActionResponse> => {
    return adminApiClient.post<AdminOrderPayload, AdminOrderActionResponse>(
      API_ENDPOINTS.ADMIN.ORDER_CONFIRM(orderId),
      data,
      getAuthHeaders(accessToken),
    );
  },

  getById: async (
    orderId: number,
    accessToken?: string | null,
  ): Promise<AdminOrderDetailResponse> => {
    return adminApiClient.get<AdminOrderDetailResponse>(
      API_ENDPOINTS.ADMIN.ORDER_BY_ID(orderId),
      undefined,
      getAuthHeaders(accessToken),
    );
  },

  getList: async (
    params: AdminOrderListParams,
    accessToken?: string | null,
  ): Promise<AdminOrderListResponse> => {
    return adminApiClient.get<AdminOrderListResponse>(
      API_ENDPOINTS.ADMIN.ORDERS,
      toQueryParams(params),
      getAuthHeaders(accessToken),
    );
  },

  getPrint: async (
    orderId: number,
    accessToken?: string | null,
    format = "html",
  ): Promise<AdminOrderPrintResponse> => {
    if (format === "html") {
      return adminApiClient.getText(
        API_ENDPOINTS.ADMIN.ORDER_PRINT(orderId),
        { format },
        getAuthHeaders(accessToken),
      );
    }

    return adminApiClient.get<AdminOrderPrintResponse>(
      API_ENDPOINTS.ADMIN.ORDER_PRINT(orderId),
      { format },
      getAuthHeaders(accessToken),
    );
  },

  sync1C: async (
    orderId: number,
    data: AdminOrderPayload = {},
    accessToken?: string | null,
  ): Promise<AdminOrderSync1CResponse> => {
    return adminApiClient.post<AdminOrderPayload, AdminOrderSync1CResponse>(
      API_ENDPOINTS.ADMIN.ORDER_SYNC_1C(orderId),
      data,
      getAuthHeaders(accessToken),
    );
  },

  update: async (
    orderId: number,
    data: AdminOrderPayload,
    accessToken?: string | null,
  ): Promise<AdminOrderUpdateResponse> => {
    return adminApiClient.patch<AdminOrderPayload, AdminOrderUpdateResponse>(
      API_ENDPOINTS.ADMIN.ORDER_BY_ID(orderId),
      data,
      getAuthHeaders(accessToken),
    );
  },

  updateStatus: async (
    orderId: number,
    data: AdminOrderPayload,
    accessToken?: string | null,
  ): Promise<AdminOrderStatusResponse> => {
    return adminApiClient.patch<AdminOrderPayload, AdminOrderStatusResponse>(
      API_ENDPOINTS.ADMIN.ORDER_STATUS(orderId),
      data,
      getAuthHeaders(accessToken),
    );
  },
};

const getAuthHeaders = (accessToken?: string | null): HeadersInit | undefined => {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
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
