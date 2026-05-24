import type { ProductShortResponse } from "@/entities/product";

export interface DiscountShortResponse {
  id: number;
  name: string;
  type: string;
  discount_type: string;
  discount_value: string;
  starts_at?: string | null;
  ends_at?: string | null;
  is_active: boolean;
}

export interface ActiveDiscountsResponse {
  items: DiscountShortResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface DiscountProductsParams {
  page?: number;
  limit?: number;
  category_id?: number;
  in_stock?: boolean;
  sort?: "discount_desc" | "price_asc" | "price_desc" | "newest";
}

export interface DiscountProductsResponse {
  items: ProductShortResponse[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
