import { apiClient, API_ENDPOINTS } from "@/shared/api";
import type {
  ActiveDiscountsResponse,
  DiscountProductsParams,
  DiscountProductsResponse,
} from "../types";

export const discountApi = {
  getActive: async (): Promise<ActiveDiscountsResponse> => {
    return apiClient.get<ActiveDiscountsResponse>(API_ENDPOINTS.DISCOUNT.ACTIVE, {
      limit: 3,
      offset: 0,
      only_with_products: true,
    });
  },

  getProducts: async (params: DiscountProductsParams = {}): Promise<DiscountProductsResponse> => {
    return apiClient.get<DiscountProductsResponse>(API_ENDPOINTS.DISCOUNT.PRODUCTS, {
      category_id: params.category_id,
      in_stock: params.in_stock ?? true,
      limit: params.limit ?? 8,
      page: params.page ?? 1,
      sort: params.sort ?? "discount_desc",
    });
  },
};
