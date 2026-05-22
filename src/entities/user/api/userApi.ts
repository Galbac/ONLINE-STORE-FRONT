import type { MessageResponse } from "@/entities/auth";
import { apiClient, API_ENDPOINTS } from "@/shared/api";
import type { UserMeDeleteRequest, UserMeResponse, UserMeUpdateRequest } from "../types";

export const userApi = {
  getMe: async (): Promise<UserMeResponse> => {
    return apiClient.get<UserMeResponse>(API_ENDPOINTS.USER.ME);
  },

  updateMe: async (data: UserMeUpdateRequest): Promise<UserMeResponse> => {
    return apiClient.patch<UserMeUpdateRequest, UserMeResponse>(API_ENDPOINTS.USER.ME, data);
  },

  deleteMe: async (_data: UserMeDeleteRequest): Promise<MessageResponse> => {
    return apiClient.delete<MessageResponse, UserMeDeleteRequest>(API_ENDPOINTS.USER.ME, _data);
  },
};
