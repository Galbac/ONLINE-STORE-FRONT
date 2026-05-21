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
  category?: ProductCategoryShortResponse | null;
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

export interface ProductSearchParams {
  q?: string;
  page?: number;
  limit?: number;
  category_id?: number;
  in_stock?: boolean;
  has_discount?: boolean;
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
  description?: string | null;
  category?: ProductCategoryShortResponse | null;
  price: string;
  old_price?: string | null;
  discount_percent?: number | null;
  unit: string;
  product_type: string;
  quantity_step: string;
  min_quantity: string;
  is_available: boolean;
  stock_quantity: string;
  stock_display: string;
  images: ProductImageResponse[];
  breadcrumbs?: ProductBreadcrumbResponse[] | null;
  similar?: ProductShortResponse[] | null;
  seo?: ProductSeoResponse | null;
}
