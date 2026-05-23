export interface NotificationListParams {
  unread_only?: boolean;
  type?: string | null;
  page?: number;
  limit?: number;
}

export interface NotificationResponse {
  id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
}

export interface NotificationListResponse {
  items: NotificationResponse[];
  total: number;
  unread_count: number;
  page: number;
  limit: number;
  pages: number;
}

export interface TestEmailNotificationRequest {
  email: string;
  message?: string | null;
  subject?: string | null;
}

export interface TestTelegramNotificationRequest {
  chat_id?: string | null;
  message?: string | null;
}

export interface TestNotificationResponse {
  chat_id?: string | null;
  email?: string | null;
  message: string;
}
