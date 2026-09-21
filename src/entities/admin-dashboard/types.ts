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

export interface PaymentSplitItem {
  method: string;
  label: string;
  count: number;
  amount: string | number;
  share_percent: number;
}

export interface DeliverySplitItem {
  type: string;
  label: string;
  count: number;
  amount: string | number;
  share_percent: number;
}

export interface StatusFunnelItem {
  status: string;
  label: string;
  count: number;
  share_percent: number;
}

export interface CategorySalesItem {
  category_id: number;
  category_name: string;
  orders_count: number;
  total_amount: string | number;
  share_percent: number;
}

export interface TopProductItem {
  id: number;
  name: string;
  category_name?: string | null;
  sold_quantity: string | number;
  total_sales: string | number;
  current_stock: string | number;
  unit: string;
  abc_group?: string;
}

export interface HourlySalesItem {
  hour: number;
  orders_count: number;
  amount: string | number;
}

export interface CustomerAnalytics {
  total_customers: number;
  new_customers: number;
  repeat_customers: number;
  repeat_purchase_rate: number;
  avg_items_per_order: number;
  average_ltv?: string | number;
}

export interface InventorySummary {
  total_products: number;
  out_of_stock_count: number;
  low_stock_count: number;
  total_stock_value: string | number;
  active_stock_alerts: number;
  estimated_lost_revenue?: string | number;
  turnover_days?: number;
}

export interface FinancialSummary {
  total_revenue: string | number;
  gmv?: string | number;
  net_revenue?: string | number;
  refunds_amount?: string | number;
  orders_count: number;
  paid_orders_count: number;
  average_order_value: string | number;
  aov_delivery?: string | number;
  aov_pickup?: string | number;
  total_discount: string | number;
  total_promo_discount: string | number;
  currency: string;
}

export interface OperationsAnalytics {
  avg_delivery_minutes: number;
  cancel_rate_percent: number;
  csat_score: number;
  total_reviews_count: number;
}


export interface PromoCodeAnalyticsItem {
  code: string;
  name?: string | null;
  uses_count: number;
  total_discount: string | number;
}

export interface LoyaltyAnalyticsSummary {
  total_points_accrued: number;
  total_points_spent: number;
  active_accounts_count: number;
}

export interface ZoneSalesItem {
  zone_id?: number | null;
  zone_name: string;
  orders_count: number;
  total_amount: string | number;
  share_percent: number;
}

export interface DeadStockItem {
  id: number;
  name: string;
  stock_quantity: string | number;
  price: string | number;
  unit: string;
}

export interface AdminAnalyticsResponse {
  date_from: string;
  date_to: string;
  period: string;
  financial: FinancialSummary;
  payment_breakdown: PaymentSplitItem[];
  delivery_breakdown: DeliverySplitItem[];
  status_funnel: StatusFunnelItem[];
  category_sales: CategorySalesItem[];
  top_products: TopProductItem[];
  dead_stock?: DeadStockItem[];
  zone_sales?: ZoneSalesItem[];
  promo_codes?: PromoCodeAnalyticsItem[];
  loyalty?: LoyaltyAnalyticsSummary;
  operations?: OperationsAnalytics;
  hourly_distribution: HourlySalesItem[];
  customers: CustomerAnalytics;
  inventory: InventorySummary;
  sales_timeline: AdminSalesSeriesItem[];
}
