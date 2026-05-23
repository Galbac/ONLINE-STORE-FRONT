export interface AdminCategoryListItemResponse {
  id: number;
  name: string;
  slug: string;
  parent_id?: number | null;
  image_url?: string | null;
  sort_order: number;
  is_active: boolean;
  is_deleted: boolean;
  products_count: number;
  created_at: string;
}

export interface AdminCategoryListResponse {
  items: AdminCategoryListItemResponse[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface AdminCategoryListParams {
  include_deleted?: string;
  is_active?: string;
  limit?: string;
  page?: string;
  parent_id?: string;
  q?: string;
}
