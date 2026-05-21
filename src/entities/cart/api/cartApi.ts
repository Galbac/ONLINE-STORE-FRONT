import { apiClient, API_ENDPOINTS } from "@/shared/api";
import type {
  CartItemCreateRequest,
  CartResponse,
  CartSummaryResponse,
  MessageCartResponse,
} from "../types";

export const cartApi = {
  get: async (): Promise<CartResponse> => {
    return apiClient.get<CartResponse>(API_ENDPOINTS.CART.DETAIL);
  },

  addItem: async (data: CartItemCreateRequest): Promise<MessageCartResponse> => {
    return apiClient.post<CartItemCreateRequest, MessageCartResponse>(
      API_ENDPOINTS.CART.ITEMS,
      data,
    );
  },

  getSummary: async (): Promise<CartSummaryResponse> => {
    return apiClient.get<CartSummaryResponse>(API_ENDPOINTS.CART.SUMMARY);
  },
};
