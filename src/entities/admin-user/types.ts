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

export interface AdminUserAddressResponse {
  apartment?: string | null;
  building?: string | null;
  city: string;
  comment?: string | null;
  created_at: string;
  entrance?: string | null;
  floor?: string | null;
  house: string;
  id: number;
  intercom?: string | null;
  is_default: boolean;
  street: string;
  title?: string | null;
}

export interface AdminUserOrderShortResponse {
  created_at: string;
  delivery_type?: string | null;
  final_price: string;
  id: number;
  items_count?: number;
  order_number: string;
  payment_status?: string | null;
  status: string;
}

export interface AdminUserDetailResponse {
  addresses: AdminUserAddressResponse[];
  created_at: string;
  email: string | null;
  id: number;
  is_active: boolean;
  is_blocked: boolean;
  is_deleted: boolean;
  name: string;
  orders_count: number;
  phone: string;
  recent_orders: AdminUserOrderShortResponse[];
  total_spent: string;
}

export interface AdminUserOrdersResponse {
  items: AdminUserOrderShortResponse[];
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

export interface AdminUserOrdersParams {
  date_from?: string;
  date_to?: string;
  limit?: string;
  page?: string;
  payment_status?: string;
  status?: string;
}

export type AdminUserPayloadValue = boolean | number | string | null;

export type AdminUserPayload = Record<string, AdminUserPayloadValue>;

export interface AdminUserUpdateResponse {
  email: string | null;
  id: number;
  is_active: boolean;
  name: string;
  phone: string;
  updated_at: string;
}

export interface AdminUserBlockResponse {
  is_blocked: boolean;
  message: string;
  user_id: number;
}
