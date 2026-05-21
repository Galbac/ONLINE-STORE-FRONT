export interface CategoryShortResponse {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
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

export interface CategoryBreadcrumbResponse {
  id: number;
  name: string;
  slug: string;
}

export interface CategorySeoResponse {
  title?: string | null;
  description?: string | null;
  keywords?: string | null;
}

export interface CategoryDetailResponse extends CategoryShortResponse {
  breadcrumbs?: CategoryBreadcrumbResponse[] | null;
  children?: CategoryShortResponse[] | null;
  seo?: CategorySeoResponse | null;
}
