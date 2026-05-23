export interface AdminProductCategoryResponse {
  id: number;
  name: string;
}

export interface AdminProductListItemResponse {
  id: number;
  name: string;
  slug: string;
  sku?: string | null;
  barcode?: string | null;
  category?: AdminProductCategoryResponse | null;
  price: string;
  unit: string;
  product_type: string;
  stock_quantity: string;
  low_stock_threshold: string;
  is_active: boolean;
  is_available: boolean;
  sync_status?: string | null;
  external_1c_id?: string | null;
}

export interface AdminProductListResponse {
  items: AdminProductListItemResponse[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface AdminProductSeoPayload {
  meta_description?: string | null;
  meta_title?: string | null;
}

export interface AdminProductCreateRequest {
  barcode?: string | null;
  category_id?: number | null;
  description?: string | null;
  is_active: boolean;
  is_available: boolean;
  low_stock_threshold: string;
  min_quantity: string;
  name: string;
  old_price?: string | null;
  price: string;
  product_type: string;
  quantity_step: string;
  seo?: AdminProductSeoPayload | null;
  sku?: string | null;
  slug: string;
  stock_quantity: string;
  unit: string;
}

export interface AdminProductImageResponse {
  id: number;
  product_id?: number | null;
  file_id?: number | null;
  url: string;
  sort_order: number;
  is_main?: boolean | null;
  created_at?: string | null;
}

export interface AdminProductDetailResponse extends AdminProductCreateRequest {
  id: number;
  external_1c_id?: string | null;
  images: AdminProductImageResponse[];
  sync_status?: string | null;
}

export type AdminUploadEntityType = "product" | "category" | "banner" | "pickup_point" | "other";

export interface AdminUploadImageRequest {
  entity_type?: AdminUploadEntityType | null;
  file: File;
}

export interface AdminUploadImageResponse {
  id: number;
  url: string;
  original_filename: string;
  mime_type: string;
  size: number;
  storage_type: string;
  entity_type?: string | null;
  created_at: string;
  stored_filename: string;
}

export interface AdminProductImageCreateRequest {
  file: File;
  is_main: boolean;
  sort_order: number;
}

export interface AdminProductListParams {
  category_id?: string;
  in_stock?: string;
  is_active?: string;
  is_available?: string;
  limit?: string;
  low_stock?: string;
  page?: string;
  product_type?: string;
  q?: string;
  sort?: string;
  sync_status?: string;
}
