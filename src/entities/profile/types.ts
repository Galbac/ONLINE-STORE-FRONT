import type { UserRole } from "@/entities/auth";

export interface ProfileUserResponse {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  role: UserRole;
  is_active: boolean;
  is_verified?: boolean;
}

export interface ProfileStatsResponse {
  orders_count: number;
  addresses_count: number;
}

export interface ProfileAddressShortResponse {
  id: number;
  city: string;
  street: string;
  house: string;
  apartment?: string | null;
}

export interface ProfileOrderShortResponse {
  id: number;
  order_number: string;
  status: string;
  payment_method?: string | null;
  payment_status?: string | null;
  delivery_type?: string | null;
  final_price: string;
  items_count?: number;
  created_at: string;
}

export interface ProfileSummaryResponse {
  user: ProfileUserResponse;
  stats: ProfileStatsResponse;
  default_address?: ProfileAddressShortResponse | null;
  active_order?: ProfileOrderShortResponse | null;
  recent_orders: ProfileOrderShortResponse[];
}

export interface AddressCreateRequest {
  title?: string | null;
  city: string;
  street: string;
  house: string;
  building?: string | null;
  apartment?: string | null;
  entrance?: string | null;
  floor?: string | null;
  intercom?: string | null;
  comment?: string | null;
  is_default?: boolean;
}

export interface AddressUpdateRequest {
  title?: string | null;
  city?: string | null;
  street?: string | null;
  house?: string | null;
  building?: string | null;
  apartment?: string | null;
  entrance?: string | null;
  floor?: string | null;
  intercom?: string | null;
  comment?: string | null;
  is_default?: boolean | null;
}

export interface AddressResponse {
  id: number;
  title?: string | null;
  city: string;
  street: string;
  house: string;
  building?: string | null;
  apartment?: string | null;
  entrance?: string | null;
  floor?: string | null;
  intercom?: string | null;
  comment?: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface AddressListResponse {
  items: AddressResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface ProfileMessageResponse {
  message: string;
}
