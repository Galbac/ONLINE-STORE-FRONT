export type AdminPromoCodeDiscountType = "percent" | "fixed" | string;

export interface AdminPromoCodeProductResponse {
  id: number;
  name: string;
  price: string;
}

export interface AdminPromoCodeCategoryResponse {
  id: number;
  name: string;
}

export interface AdminPromoCodeListItemResponse {
  code: string;
  discount_type: AdminPromoCodeDiscountType;
  discount_value: string;
  ends_at?: string | null;
  id: number;
  is_active: boolean;
  min_order_amount?: string | null;
  name?: string | null;
  starts_at?: string | null;
  usage_count: number;
  usage_limit?: number | null;
  user_usage_limit?: number | null;
}

export interface AdminPromoCodeListResponse {
  items: AdminPromoCodeListItemResponse[];
  limit: number;
  page: number;
  pages: number;
  total: number;
}

export interface AdminPromoCodeDetailResponse {
  categories?: AdminPromoCodeCategoryResponse[];
  code: string;
  description?: string | null;
  discount_type: AdminPromoCodeDiscountType;
  discount_value: string;
  ends_at?: string | null;
  id: number;
  is_active: boolean;
  max_discount_amount?: string | null;
  min_order_amount?: string | null;
  name?: string | null;
  products?: AdminPromoCodeProductResponse[];
  starts_at?: string | null;
  updated_at?: string | null;
  usage_count: number;
  usage_limit?: number | null;
  user_usage_limit?: number | null;
}

export interface AdminPromoCodeListParams {
  date_from?: string;
  date_to?: string;
  discount_type?: string;
  is_active?: string;
  limit?: string;
  page?: string;
  q?: string;
}

export type AdminPromoCodePayloadValue = boolean | number | number[] | string | string[] | null;

export type AdminPromoCodePayload = Record<string, AdminPromoCodePayloadValue>;

export interface AdminPromoCodeMessageResponse {
  message: string;
}
