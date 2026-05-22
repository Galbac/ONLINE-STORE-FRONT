import { apiClient, API_ENDPOINTS } from "@/shared/api";
import type {
  PaymentCancelRequest,
  PaymentCancelResponse,
  PaymentConfirmRequest,
  PaymentConfirmResponse,
  PaymentCreateRequest,
  PaymentCreateResponse,
  PaymentDetailResponse,
} from "../types";

const getAuthHeaders = (accessToken?: string | null): HeadersInit | undefined => {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
};

export const paymentApi = {
  create: async (data: PaymentCreateRequest): Promise<PaymentCreateResponse> => {
    return apiClient.post<PaymentCreateRequest, PaymentCreateResponse>(
      API_ENDPOINTS.PAYMENT.CREATE,
      data,
    );
  },

  getById: async (
    paymentId: number,
    accessToken?: string | null,
  ): Promise<PaymentDetailResponse> => {
    return apiClient.get<PaymentDetailResponse>(
      API_ENDPOINTS.PAYMENT.BY_ID(paymentId),
      undefined,
      getAuthHeaders(accessToken),
    );
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

  cancel: async (
    paymentId: number,
    data: PaymentCancelRequest = {},
    accessToken?: string | null,
  ): Promise<PaymentCancelResponse> => {
    return apiClient.post<PaymentCancelRequest, PaymentCancelResponse>(
      API_ENDPOINTS.PAYMENT.CANCEL(paymentId),
      data,
      getAuthHeaders(accessToken),
    );
  },
};
