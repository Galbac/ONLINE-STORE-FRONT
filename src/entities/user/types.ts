import type { UserRole } from "@/entities/auth";

export interface UserMeResponse {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  role: UserRole;
  permissions?: string[];
  is_active: boolean;
  is_verified?: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserMeUpdateRequest {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
}

export interface UserMeDeleteRequest {
  password: string;
  confirm: boolean;
}
