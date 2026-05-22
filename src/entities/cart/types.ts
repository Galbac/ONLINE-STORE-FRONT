export interface CartItemCreateRequest {
  product_id: number;
  quantity: number | string;
}

export interface CartItemUpdateRequest {
  quantity: number | string;
}

export interface ApplyPromoCodeRequest {
  code: string;
}

export interface PromoCodeCheckRequest {
  code: string;
  cart_total?: number | string | null;
}

export interface PromoCodeCheckResponse {
  valid: boolean;
  code: string;
  discount_type?: string | null;
  discount_value?: string | null;
  discount_amount?: string | null;
  min_order_amount?: string | null;
  amount_left?: string | null;
  message: string;
}

export type PromoCodeApplyRequest = ApplyPromoCodeRequest;

export interface CartPromoCodeResponse {
  code: string;
  discount_amount: string;
}

export interface CartWarningResponse {
  product_id: number;
  message: string;
}

export interface CartItemResponse {
  id: number;
  product_id: number;
  name: string;
  slug?: string | null;
  preview_image_url?: string | null;
  quantity: string;
  unit: string;
  product_type?: string | null;
  price: string;
  old_price?: string | null;
  discount_amount?: string;
  total_price: string;
  final_price: string;
  is_available: boolean;
  stock_quantity: string;
  stock_warning?: string | null;
}

export interface CartResponse {
  id: number;
  items: CartItemResponse[];
  promo_code?: CartPromoCodeResponse | null;
  items_count: number;
  total_quantity: string;
  subtotal: string;
  discount_amount: string;
  promo_discount_amount: string;
  delivery_price?: string | null;
  final_price: string;
  warnings: CartWarningResponse[];
}

export interface MessageCartResponse {
  message: string;
  cart: CartResponse;
}

export interface CartSummaryResponse {
  items_count: number;
  total_quantity: string;
  subtotal: string;
  discount_amount: string;
  promo_discount_amount: string;
  delivery_price?: string | null;
  final_price: string;
  has_warnings: boolean;
  warnings_count: number;
  promo_code?: string | null;
}

export type PromoCodeApplyResponse = MessageCartResponse;
