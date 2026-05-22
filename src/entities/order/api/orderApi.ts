import { apiClient, API_ENDPOINTS } from "@/shared/api";
import type { OrderCreateRequest, OrderCreateResponse } from "../types";

export const orderApi = {
  create: async (data: OrderCreateRequest): Promise<OrderCreateResponse> => {
    return apiClient.post<OrderCreateRequest, OrderCreateResponse>(
      API_ENDPOINTS.ORDER.CREATE,
      data,
    );
  },
};
