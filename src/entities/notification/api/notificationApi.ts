import { apiClient, API_ENDPOINTS } from "@/shared/api";
import type {
  NotificationListParams,
  NotificationListResponse,
  NotificationResponse,
  TestEmailNotificationRequest,
  TestNotificationResponse,
  TestTelegramNotificationRequest,
} from "../types";

const getAuthHeaders = (accessToken?: string | null): HeadersInit | undefined => {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
};

export const notificationApi = {
  getUnreadCount: async (accessToken?: string | null): Promise<{ unread_count: number }> => {
    return apiClient.get<{ unread_count: number }>(
      API_ENDPOINTS.NOTIFICATION.UNREAD_COUNT,
      undefined,
      getAuthHeaders(accessToken),
    );
  },

  getList: async (
    params: NotificationListParams = {},
    accessToken?: string | null,
  ): Promise<NotificationListResponse> => {
    return apiClient.get<NotificationListResponse>(
      API_ENDPOINTS.NOTIFICATION.LIST,
      {
        unread_only: params.unread_only,
        type: params.type,
        page: params.page ?? 1,
        limit: params.limit ?? 20,
      },
      getAuthHeaders(accessToken),
    );
  },

  markAsRead: async (
    notificationId: number,
    accessToken?: string | null,
  ): Promise<NotificationResponse> => {
    return apiClient.patch<undefined, NotificationResponse>(
      API_ENDPOINTS.NOTIFICATION.READ_BY_ID(notificationId),
      undefined,
      getAuthHeaders(accessToken),
    );
  },

  markAllAsRead: async (accessToken?: string | null): Promise<{ updated_count: number }> => {
    return apiClient.patch<undefined, { updated_count: number }>(
      API_ENDPOINTS.NOTIFICATION.READ_ALL,
      undefined,
      getAuthHeaders(accessToken),
    );
  },

  sendTestEmail: async (
    data: TestEmailNotificationRequest,
    accessToken?: string | null,
  ): Promise<TestNotificationResponse> => {
    return apiClient.post<TestEmailNotificationRequest, TestNotificationResponse>(
      API_ENDPOINTS.NOTIFICATION.TEST_EMAIL,
      data,
      getAuthHeaders(accessToken),
    );
  },

  sendTestTelegram: async (
    data: TestTelegramNotificationRequest,
    accessToken?: string | null,
  ): Promise<TestNotificationResponse> => {
    return apiClient.post<TestTelegramNotificationRequest, TestNotificationResponse>(
      API_ENDPOINTS.NOTIFICATION.TEST_TELEGRAM,
      data,
      getAuthHeaders(accessToken),
    );
  },
};
