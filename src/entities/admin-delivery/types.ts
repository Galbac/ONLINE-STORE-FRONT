export interface AdminDeliverySettingsResponse {
  base_delivery_price: string;
  currency: string;
  default_city?: string | null;
  delivery_comment?: string | null;
  delivery_enabled: boolean;
  free_delivery_from?: string | null;
  min_order_amount: string;
  pickup_comment?: string | null;
  pickup_enabled: boolean;
  time_slots_enabled: boolean;
  updated_at?: string | null;
}

export interface AdminDeliveryZoneResponse {
  city: string;
  created_at: string;
  delivery_price?: string | null;
  description?: string | null;
  free_delivery_from?: string | null;
  id: number;
  is_active: boolean;
  is_deleted: boolean;
  min_order_amount?: string | null;
  name: string;
  sort_order: number;
  updated_at: string;
}

export interface AdminDeliveryZoneListResponse {
  items: AdminDeliveryZoneResponse[];
  limit: number;
  page: number;
  pages: number;
  total: number;
}

export interface AdminPickupPointResponse {
  address: string;
  city: string;
  created_at: string;
  description?: string | null;
  id: number;
  is_active: boolean;
  is_deleted: boolean;
  latitude?: string | null;
  longitude?: string | null;
  name: string;
  phone?: string | null;
  sort_order: number;
  updated_at: string;
  working_hours?: string | null;
}

export interface AdminPickupPointListResponse {
  items: AdminPickupPointResponse[];
  limit: number;
  page: number;
  pages: number;
  total: number;
}

export interface AdminDeliveryListParams {
  city?: string;
  include_deleted?: string;
  is_active?: string;
  limit?: string;
  page?: string;
  q?: string;
}

export type AdminDeliveryPayloadValue = boolean | number | string | null;

export type AdminDeliveryPayload = Record<string, AdminDeliveryPayloadValue>;

export interface AdminDeliveryMessageResponse {
  message: string;
}
