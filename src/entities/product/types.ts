export interface StoreStockResponse {
  store_id: number;
  store_name: string;
  address: string;
  stock_quantity: string | number;
  is_available: boolean;
}

export interface ProductCategoryShortResponse {
  id: number;
  name: string;
  slug: string;
}

export interface ProductBreadcrumbResponse {
  id: number;
  name: string;
  slug: string;
}

export interface ProductImageResponse {
  id: number;
  url: string;
  sort_order: number;
}

export interface ProductSeoResponse {
  meta_title?: string | null;
  meta_description?: string | null;
}

export interface ProductReviewSummaryResponse {
  total: number;
  average_rating: number;
}

export interface ProductShortResponse {
  id: number;
  name: string;
  slug: string;
  article?: string | null;
  preview_image_url?: string | null;
  price: string;
  old_price?: string | null;
  discount_percent?: number | null;
  unit: string;
  product_type: string;
  min_quantity?: string | number | null;
  quantity_step?: string | number | null;
  is_halal?: boolean | null;
  is_available: boolean;
  stock_display: string;
  store_stock_quantity?: string | number | null;
  store_is_available?: boolean | null;
  category?: ProductCategoryShortResponse | null;
  created_at?: string | null;
}

export interface ProductFacetsResponse {
  has_discounts: boolean;
  discount_count: number;
  has_halal: boolean;
  halal_count: number;
  min_price: string;
  max_price: string;
  total_count: number;
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
  tag?: string;
  article?: string;
  store_id?: number;
  sort?: "price_asc" | "price_desc" | "newest" | "popular" | "name_asc" | "name_desc";
}

export interface ProductListResponse {
  items: ProductShortResponse[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ProductSearchParams {
  q?: string;
  page?: number;
  limit?: number;
  category_id?: number;
  in_stock?: boolean;
  min_price?: string | number;
  max_price?: string | number;
  has_discount?: boolean;
  product_type?: "piece" | "weight";
  tag?: string;
  article?: string;
  store_id?: number;
  sort?: "relevance" | "price_asc" | "price_desc" | "newest" | "popular";
}

export interface ProductSearchResponse {
  query: string;
  items: ProductShortResponse[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ProductDetailParams {
  with_similar?: boolean;
  with_breadcrumbs?: boolean;
}

export interface ProductSimilarParams {
  limit?: number;
  in_stock?: boolean;
}

export interface ProductSimilarResponse {
  items: ProductShortResponse[];
  total: number;
}

export interface ProductDetailResponse {
  id: number;
  name: string;
  slug: string;
  article?: string | null;
  description?: string | null;
  category?: ProductCategoryShortResponse | null;
  price: string;
  old_price?: string | null;
  discount_percent?: number | null;
  unit: string;
  product_type: string;
  quantity_step: string;
  min_quantity: string;
  is_halal?: boolean | null;
  is_available: boolean;
  stock_quantity: string;
  stock_display: string;
  images: ProductImageResponse[];
  breadcrumbs?: ProductBreadcrumbResponse[] | null;
  similar?: ProductShortResponse[] | null;
  seo?: ProductSeoResponse | null;
  stores_stock?: StoreStockResponse[];
}
