import { adminApiClient, API_ENDPOINTS } from "@/shared/api";
import type { AdminUserListParams, AdminUserListResponse } from "../types";

type QueryParams = Record<string, string | number | boolean | null | undefined>;

export const adminUserApi = {
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
