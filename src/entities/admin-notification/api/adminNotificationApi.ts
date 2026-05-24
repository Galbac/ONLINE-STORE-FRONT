import { adminApiClient, API_ENDPOINTS } from "@/shared/api";
import type {
  AdminNotificationMessageResponse,
  AdminNotificationSettingsPayload,
  AdminNotificationSettingsResponse,
  AdminNotificationTestEmailPayload,
  AdminNotificationTestTelegramPayload,
} from "../types";

export const adminNotificationApi = {
  getSettings: async (accessToken?: string | null): Promise<AdminNotificationSettingsResponse> => {
    return adminApiClient.get<AdminNotificationSettingsResponse>(
      API_ENDPOINTS.ADMIN.NOTIFICATION_SETTINGS,
      undefined,
      getAuthHeaders(accessToken),
    );
  },

  updateSettings: async (
    data: AdminNotificationSettingsPayload,
    accessToken?: string | null,
  ): Promise<AdminNotificationSettingsResponse> => {
    return adminApiClient.patch<
      AdminNotificationSettingsPayload,
      AdminNotificationSettingsResponse
    >(API_ENDPOINTS.ADMIN.NOTIFICATION_SETTINGS, data, getAuthHeaders(accessToken));
  },

  sendTestEmail: async (
    data: AdminNotificationTestEmailPayload,
    accessToken?: string | null,
  ): Promise<AdminNotificationMessageResponse> => {
    return adminApiClient.post<AdminNotificationTestEmailPayload, AdminNotificationMessageResponse>(
      API_ENDPOINTS.ADMIN.NOTIFICATION_TEST_EMAIL,
      data,
      getAuthHeaders(accessToken),
    );
  },

  sendTestTelegram: async (
    data: AdminNotificationTestTelegramPayload,
    accessToken?: string | null,
  ): Promise<AdminNotificationMessageResponse> => {
    return adminApiClient.post<
      AdminNotificationTestTelegramPayload,
      AdminNotificationMessageResponse
    >(API_ENDPOINTS.ADMIN.NOTIFICATION_TEST_TELEGRAM, data, getAuthHeaders(accessToken));
  },
};

const getAuthHeaders = (accessToken?: string | null): HeadersInit | undefined => {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
};
