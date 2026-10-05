import { apiClient, API_ENDPOINTS } from "@/shared/api";
import type { CategoryDetailResponse, CategoryListResponse, CategoryTreeResponse } from "../types";

export const categoryApi = {
  getTree: async (storeId?: number): Promise<CategoryTreeResponse> => {
    return apiClient.get<CategoryTreeResponse>(API_ENDPOINTS.CATEGORY.TREE, {
      include_empty: false,
      store_id: storeId,
      max_depth: 3,
      with_products_count: true,
    });
  },

  getList: async (storeId?: number): Promise<CategoryListResponse> => {
    return apiClient.get<CategoryListResponse>(API_ENDPOINTS.CATEGORY.LIST, {
      only_root: true,
      include_empty: false,
      store_id: storeId,
      limit: 100,
      offset: 0,
    });
  },

  getBySlug: async (slug: string, storeId?: number): Promise<CategoryDetailResponse> => {
    return apiClient.get<CategoryDetailResponse>(API_ENDPOINTS.CATEGORY.BY_SLUG(slug), {
      store_id: storeId,
      with_children: true,
      with_breadcrumbs: true,
      with_products_count: true,
    });
  },

  getById: async (categoryId: number, storeId?: number): Promise<CategoryDetailResponse> => {
    return apiClient.get<CategoryDetailResponse>(API_ENDPOINTS.CATEGORY.BY_ID(categoryId), {
      store_id: storeId,
      with_children: true,
      with_breadcrumbs: true,
      with_products_count: true,
    });
  },
};
