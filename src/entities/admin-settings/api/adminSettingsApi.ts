import { adminApiClient, API_ENDPOINTS } from "@/shared/api";
import type { AdminSettingsPayload, AdminSettingsResponse } from "../types";

export const adminSettingsApi = {
  get: async (accessToken?: string | null): Promise<AdminSettingsResponse> => {
    return adminApiClient.get<AdminSettingsResponse>(
      API_ENDPOINTS.ADMIN.SETTINGS,
      undefined,
      getAuthHeaders(accessToken),
    );
  },

  update: async (
    data: AdminSettingsPayload,
    accessToken?: string | null,
  ): Promise<AdminSettingsResponse> => {
    return adminApiClient.patch<AdminSettingsPayload, AdminSettingsResponse>(
      API_ENDPOINTS.ADMIN.SETTINGS,
      data,
      getAuthHeaders(accessToken),
    );
  },
};

const getAuthHeaders = (accessToken?: string | null): HeadersInit | undefined => {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
};
