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
  is_phone_verified?: boolean;
  phone_verified_at?: string | null;
  agreed_to_privacy?: boolean;
  agreed_to_privacy_at?: string | null;
  marketing_consent?: boolean;
  marketing_consent_at?: string | null;
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
