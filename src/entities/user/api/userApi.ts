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

  deleteMe: async (_data: UserMeDeleteRequest): Promise<MessageResponse> => {
    return apiClient.delete<MessageResponse, UserMeDeleteRequest>(API_ENDPOINTS.USER.ME, _data);
  },
};
