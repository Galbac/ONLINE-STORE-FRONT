export interface CartItemCreateRequest {
  product_id: number;
  quantity: number | string;
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
  items_count: number;
  total_quantity: string;
  subtotal: string;
  discount_amount: string;
  promo_discount_amount: string;
  delivery_price?: string | null;
  final_price: string;
  warnings: unknown[];
}

export interface MessageCartResponse {
  message: string;
  cart: CartResponse;
}
