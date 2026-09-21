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
  agreed_to_privacy?: boolean;
  marketing_consent?: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserMeUpdateRequest {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  marketing_consent?: boolean | null;
}

export interface UserMeDeleteRequest {
  password: string;
  confirm: boolean;
}
