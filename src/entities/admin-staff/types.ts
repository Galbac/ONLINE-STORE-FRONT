export type AdminStaffRole =
  | "customer"
  | "manager"
  | "admin"
  | "content_manager"
  | "picker"
  | "courier";

export interface AdminRoleResponse {
  code: AdminStaffRole | string;
  description: string;
  name: string;
  permissions: string[];
}

export interface AdminRoleListResponse {
  items: AdminRoleResponse[];
}

export interface AdminStaffListItemResponse {
  created_at: string;
  email: string | null;
  id: number;
  is_active: boolean;
  is_blocked: boolean;
  name: string;
  phone: string;
  role: AdminStaffRole;
}

export interface AdminStaffListResponse {
  items: AdminStaffListItemResponse[];
  limit: number;
  page: number;
  pages: number;
  total: number;
}

export interface AdminStaffDetailResponse {
  created_at: string;
  email: string | null;
  id: number;
  is_active: boolean;
  is_blocked: boolean;
  last_login_at?: string | null;
  name: string;
  permissions?: string[];
  phone: string;
  role: AdminStaffRole;
  updated_at?: string | null;
}

export interface AdminStaffListParams {
  is_active?: string;
  is_blocked?: string;
  limit?: string;
  page?: string;
  q?: string;
  role?: string;
}

export type AdminStaffPayloadValue = boolean | number | string | null;

export type AdminStaffPayload = Record<string, AdminStaffPayloadValue>;

export interface AdminStaffMessageResponse {
  message: string;
}
