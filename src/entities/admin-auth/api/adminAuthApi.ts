import { adminApiClient, API_ENDPOINTS } from "@/shared/api";

import type {
  AdminAuthResponse,
  AdminLoginRequest,
  AdminLogoutRequest,
  AdminMeResponse,
  AdminMessageResponse,
  AdminRoleListResponse,
} from "../types";

export const adminAuthApi = {
  login: async (data: AdminLoginRequest): Promise<AdminAuthResponse> => {
    return adminApiClient.post<AdminLoginRequest, AdminAuthResponse>(
      API_ENDPOINTS.ADMIN_AUTH.LOGIN,
      data,
    );
  },

  getMe: async (accessToken?: string | null): Promise<AdminMeResponse> => {
    return adminApiClient.get<AdminMeResponse>(
      API_ENDPOINTS.ADMIN_AUTH.ME,
      undefined,
      accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    );
  },

  logout: async (data: AdminLogoutRequest): Promise<AdminMessageResponse> => {
    return adminApiClient.post<AdminLogoutRequest, AdminMessageResponse>(
      API_ENDPOINTS.ADMIN_AUTH.LOGOUT,
      data,
    );
  },

  getRoles: async (accessToken?: string | null): Promise<AdminRoleListResponse> => {
    return adminApiClient.get<AdminRoleListResponse>(
      API_ENDPOINTS.ADMIN.ROLES,
      undefined,
      accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    );
  },
};
