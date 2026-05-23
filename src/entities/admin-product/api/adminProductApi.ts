import { adminApiClient, API_ENDPOINTS } from "@/shared/api";

import type { AdminProductListParams, AdminProductListResponse } from "../types";

type QueryParams = Record<string, string | number | boolean | null | undefined>;

export const adminProductApi = {
  getList: async (
    params: AdminProductListParams,
    accessToken?: string | null,
  ): Promise<AdminProductListResponse> => {
    return adminApiClient.get<AdminProductListResponse>(
      API_ENDPOINTS.ADMIN.PRODUCTS,
      toQueryParams(params),
      accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    );
  },
};

const toQueryParams = (params: AdminProductListParams): QueryParams => {
  return {
    category_id: params.category_id,
    in_stock: params.in_stock,
    is_active: params.is_active,
    is_available: params.is_available,
    limit: params.limit,
    low_stock: params.low_stock,
    page: params.page,
    product_type: params.product_type,
    q: params.q,
    sort: params.sort,
    sync_status: params.sync_status,
  };
};
