import type { CategoryShortResponse } from "@/entities/category";

export interface ProductShortResponse {
  id: number;
  name: string;
  slug: string;
  preview_image_url?: string | null;
  price: string;
  old_price?: string | null;
  discount_percent?: number | null;
  unit: string;
  product_type: string;
  is_available: boolean;
  stock_display: string;
  category?: CategoryShortResponse | null;
  created_at?: string | null;
}

export interface ProductPopularResponse {
  items: ProductShortResponse[];
  total: number;
}

export interface ProductNewResponse {
  items: ProductShortResponse[];
  total: number;
}

export interface ProductDiscountedResponse {
  items: ProductShortResponse[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ProductListParams {
  page?: number;
  limit?: number;
  category_id?: number;
  category_slug?: string;
  in_stock?: boolean;
  min_price?: string | number;
  max_price?: string | number;
  has_discount?: boolean;
  product_type?: "piece" | "weight";
  sort?: "price_asc" | "price_desc" | "newest" | "popular" | "name_asc" | "name_desc";
}

export interface ProductListResponse {
  items: ProductShortResponse[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
