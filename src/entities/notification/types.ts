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
