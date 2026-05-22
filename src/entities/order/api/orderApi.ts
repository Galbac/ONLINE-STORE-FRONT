import { apiClient, API_ENDPOINTS } from "@/shared/api";
import type {
  OrderCreateRequest,
  OrderCreateResponse,
  OrderCancelRequest,
  OrderCancelResponse,
  OrderDetailResponse,
  OrderListParams,
  OrderMyListResponse,
  OrderStatusResponse,
  ProfileOrderListParams,
  ProfileOrderListResponse,
  RepeatOrderRequest,
  RepeatOrderResponse,
} from "../types";

const getAuthHeaders = (accessToken?: string | null): HeadersInit | undefined => {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
};

const toOrderListQuery = (
  params?: OrderListParams,
): Record<string, string | number | boolean | null | undefined> | undefined => {
  if (!params) {
    return undefined;
  }

  return {
    date_from: params.date_from,
    date_to: params.date_to,
    delivery_type: params.delivery_type,
    limit: params.limit,
    page: params.page,
    payment_status: params.payment_status,
    status: params.status,
  };
};

const toProfileOrderListQuery = (
  params?: ProfileOrderListParams,
): Record<string, string | number | boolean | null | undefined> | undefined => {
  if (!params) {
    return undefined;
  }

  return {
    date_from: params.date_from,
    date_to: params.date_to,
    delivery_type: params.delivery_type,
    limit: params.limit,
    offset: params.offset,
    payment_status: params.payment_status,
    status: params.status,
  };
};

export const orderApi = {
  create: async (data: OrderCreateRequest): Promise<OrderCreateResponse> => {
    return apiClient.post<OrderCreateRequest, OrderCreateResponse>(
      API_ENDPOINTS.ORDER.CREATE,
      data,
    );
  },

  getMyOrders: async (
    params?: OrderListParams,
    accessToken?: string | null,
  ): Promise<OrderMyListResponse> => {
    return apiClient.get<OrderMyListResponse>(
      API_ENDPOINTS.ORDER.MY,
      toOrderListQuery(params),
      getAuthHeaders(accessToken),
    );
  },

  getById: async (orderId: number, accessToken?: string | null): Promise<OrderDetailResponse> => {
    return apiClient.get<OrderDetailResponse>(
      API_ENDPOINTS.ORDER.BY_ID(orderId),
      undefined,
      getAuthHeaders(accessToken),
    );
  },

  getProfileOrders: async (
    params?: ProfileOrderListParams,
    accessToken?: string | null,
  ): Promise<ProfileOrderListResponse> => {
    return apiClient.get<ProfileOrderListResponse>(
      API_ENDPOINTS.PROFILE.ORDERS,
      toProfileOrderListQuery(params),
      getAuthHeaders(accessToken),
    );
  },

  getStatus: async (orderId: number, accessToken?: string | null): Promise<OrderStatusResponse> => {
    return apiClient.get<OrderStatusResponse>(
      API_ENDPOINTS.ORDER.STATUS(orderId),
      undefined,
      getAuthHeaders(accessToken),
    );
  },

  cancel: async (
    orderId: number,
    data: OrderCancelRequest = {},
    accessToken?: string | null,
  ): Promise<OrderCancelResponse> => {
    return apiClient.post<OrderCancelRequest, OrderCancelResponse>(
      API_ENDPOINTS.ORDER.CANCEL(orderId),
      data,
      getAuthHeaders(accessToken),
    );
  },

  repeat: async (
    orderId: number,
    data: RepeatOrderRequest = { replace_cart: false },
    accessToken?: string | null,
  ): Promise<RepeatOrderResponse> => {
    return apiClient.post<RepeatOrderRequest, RepeatOrderResponse>(
      API_ENDPOINTS.ORDER.REPEAT(orderId),
      data,
      getAuthHeaders(accessToken),
    );
  },

  repeatProfile: async (
    orderId: number,
    data: RepeatOrderRequest = { replace_cart: false },
    accessToken?: string | null,
  ): Promise<RepeatOrderResponse> => {
    return apiClient.post<RepeatOrderRequest, RepeatOrderResponse>(
      API_ENDPOINTS.PROFILE.ORDER_REPEAT(orderId),
      data,
      getAuthHeaders(accessToken),
    );
  },
};
