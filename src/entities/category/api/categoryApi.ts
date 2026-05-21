import { apiClient, API_ENDPOINTS } from "@/shared/api";
import type { CategoryDetailResponse, CategoryListResponse, CategoryTreeResponse } from "../types";

export const categoryApi = {
  getTree: async (): Promise<CategoryTreeResponse> => {
    return apiClient.get<CategoryTreeResponse>(API_ENDPOINTS.CATEGORY.TREE, {
      include_empty: false,
      max_depth: 3,
      with_products_count: true,
    });
  },

  getList: async (): Promise<CategoryListResponse> => {
    return apiClient.get<CategoryListResponse>(API_ENDPOINTS.CATEGORY.LIST, {
      only_root: true,
      include_empty: false,
      limit: 12,
      offset: 0,
    });
  },

  getBySlug: async (slug: string): Promise<CategoryDetailResponse> => {
    return apiClient.get<CategoryDetailResponse>(API_ENDPOINTS.CATEGORY.BY_SLUG(slug), {
      with_children: true,
      with_breadcrumbs: true,
      with_products_count: true,
    });
  },

  getById: async (categoryId: number): Promise<CategoryDetailResponse> => {
    return apiClient.get<CategoryDetailResponse>(API_ENDPOINTS.CATEGORY.BY_ID(categoryId), {
      with_children: true,
      with_breadcrumbs: true,
      with_products_count: true,
    });
  },
};
