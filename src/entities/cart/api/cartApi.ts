import { apiClient, API_ENDPOINTS } from "@/shared/api";
import type {
  ApplyPromoCodeRequest,
  CartItemCreateRequest,
  CartItemUpdateRequest,
  CartResponse,
  CartSummaryResponse,
  MessageCartResponse,
  PromoCodeApplyRequest,
  PromoCodeApplyResponse,
  PromoCodeCheckRequest,
  PromoCodeCheckResponse,
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

  updateItem: async (
    cartItemId: number,
    data: CartItemUpdateRequest,
  ): Promise<MessageCartResponse> => {
    return apiClient.patch<CartItemUpdateRequest, MessageCartResponse>(
      API_ENDPOINTS.CART.ITEM_BY_ID(cartItemId),
      data,
    );
  },

  deleteItem: async (cartItemId: number): Promise<MessageCartResponse> => {
    return apiClient.delete<MessageCartResponse>(API_ENDPOINTS.CART.ITEM_BY_ID(cartItemId));
  },

  clear: async (): Promise<MessageCartResponse> => {
    return apiClient.delete<MessageCartResponse>(API_ENDPOINTS.CART.DETAIL);
  },

  applyPromoCodeToCart: async (data: ApplyPromoCodeRequest): Promise<MessageCartResponse> => {
    return apiClient.post<ApplyPromoCodeRequest, MessageCartResponse>(
      API_ENDPOINTS.CART.APPLY_PROMO_CODE,
      data,
    );
  },

  removePromoCode: async (): Promise<MessageCartResponse> => {
    return apiClient.delete<MessageCartResponse>(API_ENDPOINTS.CART.PROMO_CODE);
  },

  getSummary: async (): Promise<CartSummaryResponse> => {
    return apiClient.get<CartSummaryResponse>(API_ENDPOINTS.CART.SUMMARY);
  },

  checkPromoCode: async (data: PromoCodeCheckRequest): Promise<PromoCodeCheckResponse> => {
    return apiClient.post<PromoCodeCheckRequest, PromoCodeCheckResponse>(
      API_ENDPOINTS.PROMO_CODE.CHECK,
      data,
    );
  },

  applyPromoCode: async (data: PromoCodeApplyRequest): Promise<PromoCodeApplyResponse> => {
    return apiClient.post<PromoCodeApplyRequest, PromoCodeApplyResponse>(
      API_ENDPOINTS.PROMO_CODE.APPLY,
      data,
    );
  },
};
