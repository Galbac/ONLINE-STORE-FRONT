import { apiClient, API_ENDPOINTS } from "@/shared/api";
import type { ActiveDiscountsResponse } from "../types";

export const discountApi = {
  getActive: async (): Promise<ActiveDiscountsResponse> => {
    return apiClient.get<ActiveDiscountsResponse>(API_ENDPOINTS.DISCOUNT.ACTIVE, {
      limit: 3,
      offset: 0,
      only_with_products: true,
    });
  },
};
