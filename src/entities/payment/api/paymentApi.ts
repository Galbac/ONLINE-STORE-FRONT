import { apiClient, API_ENDPOINTS } from "@/shared/api";
import type {
  PaymentConfirmRequest,
  PaymentConfirmResponse,
  PaymentCreateRequest,
  PaymentCreateResponse,
  PaymentDetailResponse,
} from "../types";

export const paymentApi = {
  create: async (data: PaymentCreateRequest): Promise<PaymentCreateResponse> => {
    return apiClient.post<PaymentCreateRequest, PaymentCreateResponse>(
      API_ENDPOINTS.PAYMENT.CREATE,
      data,
    );
  },

  getById: async (paymentId: number): Promise<PaymentDetailResponse> => {
    return apiClient.get<PaymentDetailResponse>(API_ENDPOINTS.PAYMENT.BY_ID(paymentId));
  },

  confirm: async (
    paymentId: number,
    data: PaymentConfirmRequest,
  ): Promise<PaymentConfirmResponse> => {
    return apiClient.post<PaymentConfirmRequest, PaymentConfirmResponse>(
      API_ENDPOINTS.PAYMENT.CONFIRM(paymentId),
      data,
    );
  },
};
