import { apiClient, API_ENDPOINTS } from "@/shared/api";
import type {
  AuthResponse,
  CurrentUserResponse,
  RefreshTokenRequest,
  RegisterAuthResponse,
  TokenPairResponse,
  UserLoginRequest,
  UserRegisterRequest,
} from "../types";

export const authApi = {
  login: async (data: UserLoginRequest): Promise<AuthResponse> => {
    return apiClient.post<UserLoginRequest, AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, data);
  },

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

  refresh: async (data: RefreshTokenRequest): Promise<TokenPairResponse> => {
    return apiClient.post<RefreshTokenRequest, TokenPairResponse>(API_ENDPOINTS.AUTH.REFRESH, data);
  },
};
