import { apiClient, API_ENDPOINTS } from "@/shared/api";
import type {
  ProductDiscountedResponse,
  ProductListParams,
  ProductListResponse,
  ProductNewResponse,
  ProductPopularResponse,
} from "../types";

export const productApi = {
  getList: async (params: ProductListParams = {}): Promise<ProductListResponse> => {
    return apiClient.get<ProductListResponse>(API_ENDPOINTS.PRODUCT.LIST, {
      page: params.page ?? 1,
      limit: params.limit ?? 24,
      category_id: params.category_id,
      category_slug: params.category_slug,
      in_stock: params.in_stock,
      min_price: params.min_price,
      max_price: params.max_price,
      has_discount: params.has_discount,
      product_type: params.product_type,
      sort: params.sort ?? "popular",
    });
  },

  getPopular: async (): Promise<ProductPopularResponse> => {
    return apiClient.get<ProductPopularResponse>(API_ENDPOINTS.PRODUCT.POPULAR, {
      limit: 8,
      period_days: 30,
      in_stock: true,
    });
  },

  getDiscounted: async (): Promise<ProductDiscountedResponse> => {
    return apiClient.get<ProductDiscountedResponse>(API_ENDPOINTS.PRODUCT.DISCOUNTED, {
      page: 1,
      limit: 8,
      in_stock: true,
      sort: "discount_desc",
    });
  },

  getNew: async (): Promise<ProductNewResponse> => {
    return apiClient.get<ProductNewResponse>(API_ENDPOINTS.PRODUCT.NEW, {
      limit: 8,
      in_stock: true,
      days: 30,
    });
  },
};
