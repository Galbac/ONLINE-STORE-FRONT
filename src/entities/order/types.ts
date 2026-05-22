export interface OrderCreateRequest {
  delivery_type: "delivery" | "pickup";
  payment_method: "online" | "on_delivery";
  address_id?: number | null;
  pickup_point_id?: number | null;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  delivery_date?: string | null;
  delivery_time_slot_id?: number | null;
  comment?: string | null;
}

export interface OrderCreateResponse {
  id: number;
  order_number: string;
  status: string;
  payment_method: string;
  payment_status: string;
  delivery_type: string;
  subtotal: string;
  discount_amount: string;
  promo_discount_amount: string;
  delivery_price: string;
  final_price: string;
  payment_url?: string | null;
  created_at: string;
}
