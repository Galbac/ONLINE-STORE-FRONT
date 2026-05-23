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

export interface AdminCategoryShortResponse {
  id: number;
  name: string;
  slug: string;
}

export interface AdminCategoryImageResponse {
  id: number;
  url: string;
}

export interface AdminCategorySeoPayload {
  meta_description?: string | null;
  meta_title?: string | null;
}

export interface AdminCategoryDetailResponse {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  parent_id?: number | null;
  parent?: AdminCategoryShortResponse | null;
  children?: AdminCategoryShortResponse[] | null;
  image?: AdminCategoryImageResponse | null;
  image_url?: string | null;
  sort_order: number;
  is_active: boolean;
  products_count?: number | null;
  seo?: AdminCategorySeoPayload | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface AdminCategoryPayload {
  description?: string | null;
  image_id?: number | null;
  is_active: boolean;
  name: string;
  parent_id?: number | null;
  seo?: AdminCategorySeoPayload | null;
  slug: string;
  sort_order: number;
}

export type AdminCategoryUpdatePayload = Partial<AdminCategoryPayload>;

export interface AdminCategorySortItem {
  id: number;
  parent_id?: number | null;
  sort_order: number;
}

export interface AdminCategorySortPayload {
  items: AdminCategorySortItem[];
}

export interface AdminCategoryMessageResponse {
  message: string;
}

export type AdminUploadEntityType = "product" | "category" | "banner" | "pickup_point" | "other";

export interface AdminCategoryUploadImageRequest {
  entity_type?: AdminUploadEntityType | null;
  file: File;
}

export interface AdminCategoryUploadImageResponse {
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

export interface AdminCategoryListParams {
  include_deleted?: string;
  is_active?: string;
  limit?: string;
  page?: string;
  parent_id?: string;
  q?: string;
}
