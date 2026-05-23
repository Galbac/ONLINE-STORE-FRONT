import { adminApiClient, API_ENDPOINTS } from "@/shared/api";
import type {
  AdminUserBlockResponse,
  AdminUserDetailResponse,
  AdminUserListParams,
  AdminUserListResponse,
  AdminUserOrdersParams,
  AdminUserOrdersResponse,
  AdminUserPayload,
  AdminUserUpdateResponse,
} from "../types";

type QueryParams = Record<string, string | number | boolean | null | undefined>;

export const adminUserApi = {
  block: async (
    userId: number,
    data: AdminUserPayload = {},
    accessToken?: string | null,
  ): Promise<AdminUserBlockResponse> => {
    return adminApiClient.patch<AdminUserPayload, AdminUserBlockResponse>(
      API_ENDPOINTS.ADMIN.USER_BLOCK(userId),
      data,
      getAuthHeaders(accessToken),
    );
  },

  getById: async (
    userId: number,
    accessToken?: string | null,
  ): Promise<AdminUserDetailResponse> => {
    return adminApiClient.get<AdminUserDetailResponse>(
      API_ENDPOINTS.ADMIN.USER_BY_ID(userId),
      undefined,
      getAuthHeaders(accessToken),
    );
  },

  getList: async (
    params: AdminUserListParams,
    accessToken?: string | null,
  ): Promise<AdminUserListResponse> => {
    return adminApiClient.get<AdminUserListResponse>(
      API_ENDPOINTS.ADMIN.USERS,
      toQueryParams(params),
      getAuthHeaders(accessToken),
    );
  },

  getOrders: async (
    userId: number,
    params: AdminUserOrdersParams,
    accessToken?: string | null,
  ): Promise<AdminUserOrdersResponse> => {
    return adminApiClient.get<AdminUserOrdersResponse>(
      API_ENDPOINTS.ADMIN.USER_ORDERS(userId),
      toOrdersQueryParams(params),
      getAuthHeaders(accessToken),
    );
  },

  unblock: async (
    userId: number,
    data: AdminUserPayload = {},
    accessToken?: string | null,
  ): Promise<AdminUserBlockResponse> => {
    return adminApiClient.patch<AdminUserPayload, AdminUserBlockResponse>(
      API_ENDPOINTS.ADMIN.USER_UNBLOCK(userId),
      data,
      getAuthHeaders(accessToken),
    );
  },

  update: async (
    userId: number,
    data: AdminUserPayload,
    accessToken?: string | null,
  ): Promise<AdminUserUpdateResponse> => {
    return adminApiClient.patch<AdminUserPayload, AdminUserUpdateResponse>(
      API_ENDPOINTS.ADMIN.USER_BY_ID(userId),
      data,
      getAuthHeaders(accessToken),
    );
  },
};

const getAuthHeaders = (accessToken?: string | null): HeadersInit | undefined => {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
};

const toQueryParams = (params: AdminUserListParams): QueryParams => {
  return {
    date_from: params.date_from,
    date_to: params.date_to,
    is_active: params.is_active,
    is_blocked: params.is_blocked,
    is_deleted: params.is_deleted,
    limit: params.limit,
    page: params.page,
    q: params.q,
  };
};

const toOrdersQueryParams = (params: AdminUserOrdersParams): QueryParams => {
  return {
    date_from: params.date_from,
    date_to: params.date_to,
    limit: params.limit,
    page: params.page,
    payment_status: params.payment_status,
    status: params.status,
  };
};
