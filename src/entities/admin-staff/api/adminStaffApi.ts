import { adminApiClient, API_ENDPOINTS } from "@/shared/api";
import type {
  AdminRoleListResponse,
  AdminStaffDetailResponse,
  AdminStaffListParams,
  AdminStaffListResponse,
  AdminStaffMessageResponse,
  AdminStaffPayload,
} from "../types";

type QueryParams = Record<string, string | number | boolean | null | undefined>;

export const adminStaffApi = {
  changeRole: async (
    staffId: number,
    data: AdminStaffPayload,
    accessToken?: string | null,
  ): Promise<AdminStaffDetailResponse> => {
    return adminApiClient.patch<AdminStaffPayload, AdminStaffDetailResponse>(
      API_ENDPOINTS.ADMIN.STAFF_ROLE(staffId),
      data,
      getAuthHeaders(accessToken),
    );
  },

  create: async (
    data: AdminStaffPayload,
    accessToken?: string | null,
  ): Promise<AdminStaffDetailResponse> => {
    return adminApiClient.post<AdminStaffPayload, AdminStaffDetailResponse>(
      API_ENDPOINTS.ADMIN.STAFF,
      data,
      getAuthHeaders(accessToken),
    );
  },

  delete: async (
    staffId: number,
    accessToken?: string | null,
  ): Promise<AdminStaffMessageResponse> => {
    return adminApiClient.delete<AdminStaffMessageResponse>(
      API_ENDPOINTS.ADMIN.STAFF_BY_ID(staffId),
      getAuthHeaders(accessToken),
    );
  },

  getById: async (
    staffId: number,
    accessToken?: string | null,
  ): Promise<AdminStaffDetailResponse> => {
    return adminApiClient.get<AdminStaffDetailResponse>(
      API_ENDPOINTS.ADMIN.STAFF_BY_ID(staffId),
      undefined,
      getAuthHeaders(accessToken),
    );
  },

  getList: async (
    params: AdminStaffListParams,
    accessToken?: string | null,
  ): Promise<AdminStaffListResponse> => {
    return adminApiClient.get<AdminStaffListResponse>(
      API_ENDPOINTS.ADMIN.STAFF,
      toQueryParams(params),
      getAuthHeaders(accessToken),
    );
  },

  getRoles: async (accessToken?: string | null): Promise<AdminRoleListResponse> => {
    return adminApiClient.get<AdminRoleListResponse>(
      API_ENDPOINTS.ADMIN.ROLES,
      undefined,
      getAuthHeaders(accessToken),
    );
  },

  update: async (
    staffId: number,
    data: AdminStaffPayload,
    accessToken?: string | null,
  ): Promise<AdminStaffDetailResponse> => {
    return adminApiClient.patch<AdminStaffPayload, AdminStaffDetailResponse>(
      API_ENDPOINTS.ADMIN.STAFF_BY_ID(staffId),
      data,
      getAuthHeaders(accessToken),
    );
  },
};

const getAuthHeaders = (accessToken?: string | null): HeadersInit | undefined => {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
};

const toQueryParams = (params: AdminStaffListParams): QueryParams => {
  return {
    is_active: params.is_active,
    is_blocked: params.is_blocked,
    limit: params.limit,
    page: params.page,
    q: params.q,
    role: params.role,
  };
};
