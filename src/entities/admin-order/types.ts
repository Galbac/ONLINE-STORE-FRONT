export interface AdminOrderListItemResponse {
  id: number;
  order_number: string;
  status: string;
  payment_method?: string | null;
  payment_status?: string | null;
  delivery_type: string;
  customer_name: string;
  customer_phone: string;
  final_price: string;
  sync_status: string;
  created_at: string;
}

export interface AdminOrderCustomerResponse {
  email?: string | null;
  id: number;
  name: string;
  phone: string;
}

export interface AdminOrderAddressResponse {
  apartment?: string | null;
  city: string;
  house: string;
  street: string;
}

export interface AdminOrderPickupPointResponse {
  address: string;
  city: string;
  id: number;
  name: string;
}

export interface AdminOrderItemResponse {
  final_price: string;
  id: number;
  price: string;
  product_id: number;
  product_name: string;
  quantity: string;
  unit: string;
}

export interface AdminOrderPaymentResponse {
  amount: string;
  cancelled_at?: string | null;
  currency: string;
  id: number;
  paid_at?: string | null;
  provider?: string | null;
  provider_payment_id?: string | null;
  refund_status?: string | null;
  status: string;
}

export interface AdminOrderStatusHistoryItemResponse {
  comment?: string | null;
  created_at: string;
  status: string;
}

export interface AdminOrderDetailResponse {
  address?: AdminOrderAddressResponse | null;
  cancel_reason?: string | null;
  comment?: string | null;
  created_at: string;
  customer: AdminOrderCustomerResponse;
  delivery_price: string;
  delivery_type: string;
  discount_amount: string;
  external_1c_id?: string | null;
  final_price: string;
  id: number;
  items: AdminOrderItemResponse[];
  last_sync_at?: string | null;
  order_number: string;
  payment?: AdminOrderPaymentResponse | null;
  payment_method?: string | null;
  payment_status?: string | null;
  pickup_point?: AdminOrderPickupPointResponse | null;
  promo_discount_amount: string;
  status: string;
  status_history?: AdminOrderStatusHistoryItemResponse[];
  subtotal: string;
  sync_error?: string | null;
  sync_error_code?: string | null;
  sync_status: string;
}

export interface AdminOrderListResponse {
  items: AdminOrderListItemResponse[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface AdminOrderListParams {
  date_from?: string;
  date_to?: string;
  delivery_type?: string;
  limit?: string;
  max_amount?: string;
  min_amount?: string;
  page?: string;
  payment_method?: string;
  payment_status?: string;
  q?: string;
  status?: string;
  sync_status?: string;
}

export type AdminOrderPayloadValue = boolean | number | string | null;

export type AdminOrderPayload = Record<string, AdminOrderPayloadValue>;

export interface AdminOrderUpdateResponse {
  comment?: string | null;
  customer_name: string;
  customer_phone: string;
  id: number;
  internal_comment?: string | null;
  order_number: string;
  updated_at: string;
}

export interface AdminOrderStatusResponse {
  id: number;
  order_number: string;
  status: string;
  updated_at: string;
}

export interface AdminOrderActionResponse {
  message: string;
  order: {
    cancel_reason?: string | null;
    id: number;
    order_number: string;
    status: string;
  };
}

export interface AdminOrderSync1CResponse {
  external_1c_id?: string | null;
  last_sync_at?: string | null;
  order_id: number;
  order_number: string;
  sync_status: string;
}
