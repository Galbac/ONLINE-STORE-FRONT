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
