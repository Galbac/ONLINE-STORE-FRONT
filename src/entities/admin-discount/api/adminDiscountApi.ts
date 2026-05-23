import { adminApiClient, API_ENDPOINTS } from "@/shared/api";
import type {
  AdminDiscountDetailResponse,
  AdminDiscountListParams,
  AdminDiscountListResponse,
  AdminDiscountMessageResponse,
  AdminDiscountPayload,
  AdminDiscountStatusResponse,
} from "../types";

type QueryParams = Record<string, string | number | boolean | null | undefined>;

export const adminDiscountApi = {
  activate: async (
    discountId: number,
    accessToken?: string | null,
  ): Promise<AdminDiscountStatusResponse> => {
    return adminApiClient.post<undefined, AdminDiscountStatusResponse>(
      API_ENDPOINTS.ADMIN.DISCOUNT_ACTIVATE(discountId),
      undefined,
      getAuthHeaders(accessToken),
    );
  },

  create: async (
    data: AdminDiscountPayload,
    accessToken?: string | null,
  ): Promise<AdminDiscountDetailResponse> => {
    return adminApiClient.post<AdminDiscountPayload, AdminDiscountDetailResponse>(
      API_ENDPOINTS.ADMIN.DISCOUNTS,
      data,
      getAuthHeaders(accessToken),
    );
  },

  deactivate: async (
    discountId: number,
    accessToken?: string | null,
  ): Promise<AdminDiscountStatusResponse> => {
    return adminApiClient.post<undefined, AdminDiscountStatusResponse>(
      API_ENDPOINTS.ADMIN.DISCOUNT_DEACTIVATE(discountId),
      undefined,
      getAuthHeaders(accessToken),
    );
  },

  delete: async (
    discountId: number,
    accessToken?: string | null,
  ): Promise<AdminDiscountMessageResponse> => {
    return adminApiClient.delete<AdminDiscountMessageResponse>(
      API_ENDPOINTS.ADMIN.DISCOUNT_BY_ID(discountId),
      getAuthHeaders(accessToken),
    );
  },

  getById: async (
    discountId: number,
    accessToken?: string | null,
  ): Promise<AdminDiscountDetailResponse> => {
    return adminApiClient.get<AdminDiscountDetailResponse>(
      API_ENDPOINTS.ADMIN.DISCOUNT_BY_ID(discountId),
      undefined,
      getAuthHeaders(accessToken),
    );
  },

  getList: async (
    params: AdminDiscountListParams,
    accessToken?: string | null,
  ): Promise<AdminDiscountListResponse> => {
    return adminApiClient.get<AdminDiscountListResponse>(
      API_ENDPOINTS.ADMIN.DISCOUNTS,
      toQueryParams(params),
      getAuthHeaders(accessToken),
    );
  },

  update: async (
    discountId: number,
    data: AdminDiscountPayload,
    accessToken?: string | null,
  ): Promise<AdminDiscountDetailResponse> => {
    return adminApiClient.patch<AdminDiscountPayload, AdminDiscountDetailResponse>(
      API_ENDPOINTS.ADMIN.DISCOUNT_BY_ID(discountId),
      data,
      getAuthHeaders(accessToken),
    );
  },
};

const getAuthHeaders = (accessToken?: string | null): HeadersInit | undefined => {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
};

const toQueryParams = (params: AdminDiscountListParams): QueryParams => {
  return {
    date_from: params.date_from,
    date_to: params.date_to,
    discount_type: params.discount_type,
    is_active: params.is_active,
    limit: params.limit,
    page: params.page,
    q: params.q,
    type: params.type,
  };
};
