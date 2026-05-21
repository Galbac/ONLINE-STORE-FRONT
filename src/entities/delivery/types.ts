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
