import type { CartResponse } from "@/entities/cart";

export interface OrderListParams {
  status?: string | null;
  payment_status?: string | null;
  delivery_type?: "delivery" | "pickup" | null;
  date_from?: string | null;
  date_to?: string | null;
  page?: number;
  limit?: number;
}

export interface ProfileOrderListParams {
  status?: string | null;
  payment_status?: string | null;
  delivery_type?: "delivery" | "pickup" | null;
  date_from?: string | null;
  date_to?: string | null;
  limit?: number;
  offset?: number;
}

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

export interface OrderAddressResponse {
  id: number;
  city: string;
  street: string;
  house: string;
  apartment?: string | null;
  comment?: string | null;
}

export interface OrderPickupPointResponse {
  id: number;
  name: string;
}

export interface OrderPaymentResponse {
  id: number;
  amount: string;
  status: string;
  payment_url?: string | null;
}

export interface OrderItemResponse {
  id?: number | null;
  product_id: number;
  product_name: string;
  product_slug: string;
  price: string;
  old_price?: string | null;
  quantity: string;
  unit: string;
  product_type: string;
  discount_amount: string;
  total_price: string;
  final_price: string;
}

export interface OrderDetailResponse {
  id: number;
  order_number: string;
  status: string;
  payment_method?: string | null;
  payment_status?: string | null;
  delivery_type: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  address?: OrderAddressResponse | null;
  pickup_point?: OrderPickupPointResponse | null;
  payment?: OrderPaymentResponse | null;
  items: OrderItemResponse[];
  subtotal: string;
  discount_amount: string;
  promo_discount_amount: string;
  delivery_price: string;
  final_price: string;
  comment?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderShortResponse {
  id: number;
  order_number: string;
  status: string;
  payment_method?: string | null;
  payment_status?: string | null;
  delivery_type?: string | null;
  items_count?: number;
  final_price: string;
  created_at: string;
}

export interface OrderMyListResponse {
  items: OrderShortResponse[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ProfileOrderListResponse {
  items: OrderShortResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface RepeatOrderRequest {
  replace_cart?: boolean;
}

export interface RepeatOrderWarningResponse {
  product_id: number;
  product_name: string;
  reason: string;
  requested_quantity?: string | null;
  added_quantity?: string | null;
}

export interface RepeatOrderResponse {
  message: string;
  cart: CartResponse;
  warnings: RepeatOrderWarningResponse[];
}

export interface OrderNextActionResponse {
  type: string;
  label: string;
}

export interface OrderStatusResponse {
  id: number;
  order_number: string;
  status: string;
  status_label: string;
  payment_status?: string | null;
  payment_status_label?: string | null;
  delivery_type: string;
  next_action?: OrderNextActionResponse | null;
  updated_at: string;
}
