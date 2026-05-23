export interface AdminUserListItemResponse {
  created_at: string;
  email: string | null;
  id: number;
  is_active: boolean;
  is_blocked: boolean;
  name: string;
  orders_count: number;
  phone: string;
  total_spent: string;
}

export interface AdminUserListResponse {
  items: AdminUserListItemResponse[];
  limit: number;
  page: number;
  pages: number;
  total: number;
}

export interface AdminUserListParams {
  date_from?: string;
  date_to?: string;
  is_active?: string;
  is_blocked?: string;
  is_deleted?: string;
  limit?: string;
  page?: string;
  q?: string;
}
