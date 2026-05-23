export interface AdminDashboardOrdersStats {
  today_count: number;
  new_count: number;
  paid_today_count: number;
}

export interface AdminDashboardSalesStats {
  today_amount: string;
  currency: string;
}

export interface AdminDashboardProductsStats {
  low_stock_count: number;
  total_active: number;
}

export interface AdminDashboardUsersStats {
  total: number;
}

export interface AdminRecentOrderResponse {
  id: number;
  order_number: string;
  status: string;
  final_price: string;
  created_at: string;
}

export interface AdminPopularProductResponse {
  id: number;
  name: string;
  price: string;
  popularity: number;
}

export interface AdminDashboardResponse {
  orders: AdminDashboardOrdersStats;
  sales: AdminDashboardSalesStats;
  products: AdminDashboardProductsStats;
  users: AdminDashboardUsersStats;
  recent_orders: AdminRecentOrderResponse[];
  popular_products: AdminPopularProductResponse[];
}

export type AdminSalesGroupBy = "day" | "week" | "month";

export interface AdminDashboardSalesParams {
  date_from?: string;
  date_to?: string;
  group_by?: AdminSalesGroupBy;
}

export interface AdminSalesSeriesItem {
  date: string;
  amount: string;
  orders_count: number;
}

export interface AdminSalesResponse {
  date_from: string;
  date_to: string;
  group_by: AdminSalesGroupBy;
  total_amount: string;
  orders_count: number;
  average_order_value: string;
  series: AdminSalesSeriesItem[];
}

export interface AdminLowStockParams {
  category_id?: number;
  limit?: number;
  offset?: number;
}

export interface AdminLowStockProductResponse {
  id: number;
  name: string;
  sku?: string | null;
  unit: string;
  product_type: string;
  stock_quantity: string;
  low_stock_threshold: string;
  is_available: boolean;
}

export interface AdminLowStockResponse {
  items: AdminLowStockProductResponse[];
  total: number;
  limit: number;
  offset: number;
}
