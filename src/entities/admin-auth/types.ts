export type AdminUserRole =
  | "customer"
  | "manager"
  | "admin"
  | "content_manager"
  | "picker"
  | "courier";

export interface AdminLoginRequest {
  login: string;
  password: string;
}

export interface AdminLogoutRequest {
  refresh_token: string;
}

export interface AdminUserResponse {
  id: number;
  name: string;
  email: string | null;
  phone: string;
  role: AdminUserRole;
  permissions: string[];
}

export interface AdminMeResponse extends AdminUserResponse {
  is_active: boolean;
}

export interface AdminAuthResponse {
  user: AdminUserResponse;
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface AdminMessageResponse {
  message: string;
}

export interface AdminRoleResponse {
  code: string;
  name: string;
  description: string;
  permissions: string[];
}

export interface AdminRoleListResponse {
  items: AdminRoleResponse[];
}
