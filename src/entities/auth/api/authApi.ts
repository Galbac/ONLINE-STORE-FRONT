import { apiClient, API_ENDPOINTS } from "@/shared/api";
import type { CurrentUserResponse, RegisterAuthResponse, UserRegisterRequest } from "../types";

export const authApi = {
  register: async (data: UserRegisterRequest): Promise<RegisterAuthResponse> => {
    return apiClient.post<UserRegisterRequest, RegisterAuthResponse>(
      API_ENDPOINTS.AUTH.REGISTER,
      data,
    );
  },

  getMe: async (accessToken: string): Promise<CurrentUserResponse> => {
    return apiClient.get<CurrentUserResponse>(API_ENDPOINTS.AUTH.ME, undefined, {
      Authorization: `Bearer ${accessToken}`,
    });
  },
};
