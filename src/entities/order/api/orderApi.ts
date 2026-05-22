import { apiClient, API_ENDPOINTS } from "@/shared/api";
import type {
  OrderCreateRequest,
  OrderCreateResponse,
  OrderDetailResponse,
  OrderStatusResponse,
} from "../types";

export const orderApi = {
  create: async (data: OrderCreateRequest): Promise<OrderCreateResponse> => {
    return apiClient.post<OrderCreateRequest, OrderCreateResponse>(
      API_ENDPOINTS.ORDER.CREATE,
      data,
    );
  },

  getById: async (orderId: number): Promise<OrderDetailResponse> => {
    return apiClient.get<OrderDetailResponse>(API_ENDPOINTS.ORDER.BY_ID(orderId));
  },

  getStatus: async (orderId: number): Promise<OrderStatusResponse> => {
    return apiClient.get<OrderStatusResponse>(API_ENDPOINTS.ORDER.STATUS(orderId));
  },
};
