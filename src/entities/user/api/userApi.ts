import type { MessageResponse } from "@/entities/auth";
import { apiClient, API_ENDPOINTS } from "@/shared/api";
import type { UserMeDeleteRequest, UserMeResponse, UserMeUpdateRequest } from "../types";

const getAuthHeaders = (accessToken?: string | null): HeadersInit | undefined => {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
};

export const userApi = {
  getMe: async (accessToken?: string | null): Promise<UserMeResponse> => {
    return apiClient.get<UserMeResponse>(
      API_ENDPOINTS.USER.ME,
      undefined,
      getAuthHeaders(accessToken),
    );
  },

  updateMe: async (data: UserMeUpdateRequest): Promise<UserMeResponse> => {
    return apiClient.patch<UserMeUpdateRequest, UserMeResponse>(API_ENDPOINTS.USER.ME, data);
  },

  updateMarketingConsent: async (marketing_consent: boolean): Promise<UserMeResponse> => {
    return apiClient.patch<{ marketing_consent: boolean }, UserMeResponse>(
      API_ENDPOINTS.USER.MARKETING_CONSENT,
      { marketing_consent },
    );
  },

  sendPhoneOtp: async (): Promise<MessageResponse> => {
    return apiClient.post<undefined, MessageResponse>(API_ENDPOINTS.USER.PHONE_SEND_OTP);
  },

  verifyPhoneOtp: async (otp_code: string): Promise<UserMeResponse> => {
    return apiClient.post<{ otp_code: string }, UserMeResponse>(API_ENDPOINTS.USER.PHONE_VERIFY_OTP, {
      otp_code,
    });
  },

  deleteMe: async (data: UserMeDeleteRequest): Promise<MessageResponse> => {
    return apiClient.delete<MessageResponse, UserMeDeleteRequest>(API_ENDPOINTS.USER.ME, data);
  },
};
