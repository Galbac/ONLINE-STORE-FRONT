export type UserRole = "customer" | "manager" | "admin" | string;

export interface UserRegisterRequest {
  name: string;
  phone: string;
  password: string;
  email?: string | null;
}

export interface UserLoginRequest {
  login: string;
  password: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface LogoutRequest {
  refresh_token: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  new_password_confirm: string;
}

export interface ForgotPasswordRequest {
  login: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
  new_password_confirm: string;
}

export interface MessageResponse {
  message: string;
}

export interface TokenPairResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserShortResponse {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  role: UserRole;
  is_active: boolean;
}

export interface AuthResponse extends TokenPairResponse {
  user: UserShortResponse;
}

export interface RegisterAuthResponse {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  role: UserRole;
  is_active: boolean;
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface CurrentUserResponse {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  role: UserRole;
  permissions: string[];
  is_active: boolean;
  is_verified?: boolean;
  created_at: string;
}
