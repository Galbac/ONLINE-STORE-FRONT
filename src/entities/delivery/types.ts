export interface DeliveryOptionItemResponse {
  enabled: boolean;
  title: string;
  description?: string | null;
  min_order_amount?: string | null;
  base_price?: string | null;
  free_from_amount?: string | null;
  has_time_slots?: boolean | null;
  price?: string | null;
  has_pickup_points?: boolean | null;
}

export interface DeliveryOptionsResponse {
  delivery: DeliveryOptionItemResponse;
  pickup: DeliveryOptionItemResponse;
}

export interface DeliveryZoneShortResponse {
  id: number;
  name: string;
}

export interface DeliveryCalculateRequest {
  delivery_type: "delivery" | "pickup";
  cart_total?: string | number | null;
  address_id?: number | null;
  pickup_point_id?: number | null;
  city?: string | null;
}

export interface DeliveryCalculateResponse {
  available: boolean;
  delivery_price?: string | null;
  free_delivery_from?: string | null;
  amount_left_for_free_delivery?: string | null;
  min_order_amount?: string | null;
  zone?: DeliveryZoneShortResponse | null;
  message: string;
}

export interface PickupPointResponse {
  id: number;
  name: string;
  city: string;
  address: string;
  working_hours?: string | null;
  phone?: string | null;
  is_active: boolean;
  latitude?: string | null;
  longitude?: string | null;
}

export interface PickupPointDetailResponse extends PickupPointResponse {
  description?: string | null;
}

export interface PickupPointListResponse {
  items: PickupPointResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface DeliveryTimeSlotResponse {
  id: number;
  start_time: string;
  end_time: string;
  label: string;
  available: boolean;
  orders_limit?: number | null;
  orders_count?: number | null;
  reason?: string | null;
}

export interface DeliveryTimeSlotsResponse {
  date: string;
  delivery_type: string;
  items: DeliveryTimeSlotResponse[];
}

export interface PickupPointListParams {
  city?: string;
  only_active?: boolean;
  limit?: number;
  offset?: number;
}

export interface DeliveryTimeSlotsParams {
  date: string;
  delivery_type: "delivery" | "pickup";
  pickup_point_id?: number | null;
  address_id?: number | null;
  city?: string | null;
}
