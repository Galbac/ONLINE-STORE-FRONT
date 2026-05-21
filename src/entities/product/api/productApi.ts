import { apiClient, API_ENDPOINTS } from "@/shared/api";
import type {
  ProductDiscountedResponse,
  ProductNewResponse,
  ProductPopularResponse,
} from "../types";

export const productApi = {
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
