export type AdminDiscountTargetType = "product" | "category" | "cart" | string;

export type AdminDiscountValueType = "percent" | "fixed" | string;

export interface AdminDiscountProductResponse {
  id: number;
  name: string;
  price: string;
}

export interface AdminDiscountCategoryResponse {
  id: number;
  name: string;
}

export interface AdminDiscountListItemResponse {
  created_at: string;
  discount_type: AdminDiscountValueType;
  discount_value: string;
  ends_at?: string | null;
  id: number;
  is_active: boolean;
  name: string;
  starts_at?: string | null;
  type: AdminDiscountTargetType;
}

export interface AdminDiscountListResponse {
  items: AdminDiscountListItemResponse[];
  limit: number;
  page: number;
  pages: number;
  total: number;
}

export interface AdminDiscountDetailResponse {
  categories?: AdminDiscountCategoryResponse[];
  discount_type: AdminDiscountValueType;
  discount_value: string;
  ends_at?: string | null;
  id: number;
  is_active: boolean;
  name: string;
  products?: AdminDiscountProductResponse[];
  starts_at?: string | null;
  type: AdminDiscountTargetType;
  updated_at?: string | null;
}

export interface AdminDiscountListParams {
  date_from?: string;
  date_to?: string;
  discount_type?: string;
  is_active?: string;
  limit?: string;
  page?: string;
  q?: string;
  type?: string;
}

export type AdminDiscountPayloadValue = boolean | number | number[] | string | string[] | null;

export type AdminDiscountPayload = Record<string, AdminDiscountPayloadValue>;

export interface AdminDiscountStatusResponse {
  id: number;
  is_active: boolean;
  message: string;
}

export interface AdminDiscountMessageResponse {
  message: string;
}
