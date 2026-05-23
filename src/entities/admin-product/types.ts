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
