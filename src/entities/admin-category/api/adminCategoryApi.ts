import { adminApiClient, API_ENDPOINTS } from "@/shared/api";

import type { AdminCategoryListParams, AdminCategoryListResponse } from "../types";

type QueryParams = Record<string, string | number | boolean | null | undefined>;

export const adminCategoryApi = {
  getList: async (
    params: AdminCategoryListParams,
    accessToken?: string | null,
  ): Promise<AdminCategoryListResponse> => {
    return adminApiClient.get<AdminCategoryListResponse>(
      API_ENDPOINTS.ADMIN.CATEGORIES,
      toQueryParams(params),
      accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    );
  },
};

const toQueryParams = (params: AdminCategoryListParams): QueryParams => {
  return {
    include_deleted: params.include_deleted,
    is_active: params.is_active,
    limit: params.limit,
    page: params.page,
    parent_id: params.parent_id,
    q: params.q,
  };
};
