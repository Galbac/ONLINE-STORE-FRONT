import { adminApiClient, API_ENDPOINTS } from "@/shared/api";
import type {
  AdminPromoCodeDetailResponse,
  AdminPromoCodeListParams,
  AdminPromoCodeListResponse,
  AdminPromoCodeMessageResponse,
  AdminPromoCodePayload,
} from "../types";

type QueryParams = Record<string, string | number | boolean | null | undefined>;

export const adminPromoCodeApi = {
  create: async (
    data: AdminPromoCodePayload,
    accessToken?: string | null,
  ): Promise<AdminPromoCodeDetailResponse> => {
    return adminApiClient.post<AdminPromoCodePayload, AdminPromoCodeDetailResponse>(
      API_ENDPOINTS.ADMIN.PROMO_CODES,
      data,
      getAuthHeaders(accessToken),
    );
  },

  delete: async (
    promoCodeId: number,
    accessToken?: string | null,
  ): Promise<AdminPromoCodeMessageResponse> => {
    return adminApiClient.delete<AdminPromoCodeMessageResponse>(
      API_ENDPOINTS.ADMIN.PROMO_CODE_BY_ID(promoCodeId),
      getAuthHeaders(accessToken),
    );
  },

  getById: async (
    promoCodeId: number,
    accessToken?: string | null,
  ): Promise<AdminPromoCodeDetailResponse> => {
    return adminApiClient.get<AdminPromoCodeDetailResponse>(
      API_ENDPOINTS.ADMIN.PROMO_CODE_BY_ID(promoCodeId),
      undefined,
      getAuthHeaders(accessToken),
    );
  },

  getList: async (
    params: AdminPromoCodeListParams,
    accessToken?: string | null,
  ): Promise<AdminPromoCodeListResponse> => {
    return adminApiClient.get<AdminPromoCodeListResponse>(
      API_ENDPOINTS.ADMIN.PROMO_CODES,
      toQueryParams(params),
      getAuthHeaders(accessToken),
    );
  },

  update: async (
    promoCodeId: number,
    data: AdminPromoCodePayload,
    accessToken?: string | null,
  ): Promise<AdminPromoCodeDetailResponse> => {
    return adminApiClient.patch<AdminPromoCodePayload, AdminPromoCodeDetailResponse>(
      API_ENDPOINTS.ADMIN.PROMO_CODE_BY_ID(promoCodeId),
      data,
      getAuthHeaders(accessToken),
    );
  },
};

const getAuthHeaders = (accessToken?: string | null): HeadersInit | undefined => {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
};

const toQueryParams = (params: AdminPromoCodeListParams): QueryParams => {
  return {
    date_from: params.date_from,
    date_to: params.date_to,
    discount_type: params.discount_type,
    is_active: params.is_active,
    limit: params.limit,
    page: params.page,
    q: params.q,
  };
};
