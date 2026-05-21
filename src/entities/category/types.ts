export interface CategoryShortResponse {
  id: number;
  name: string;
  slug: string;
  parent_id?: number | null;
  image_url?: string | null;
  sort_order: number;
  products_count?: number | null;
}

export interface CategoryTreeItemResponse extends CategoryShortResponse {
  children?: CategoryTreeItemResponse[];
}

export interface CategoryTreeResponse {
  items: CategoryTreeItemResponse[];
}

export interface CategoryListResponse {
  items: CategoryShortResponse[];
  total: number;
  limit: number;
  offset: number;
}
