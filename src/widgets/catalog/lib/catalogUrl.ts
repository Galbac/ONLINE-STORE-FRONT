import { ROUTES } from "@/shared/config";

export interface CatalogUrlParams {
  [key: string]: string | undefined;
  page?: string | undefined;
  limit?: string | undefined;
  category_id?: string | undefined;
  in_stock?: string | undefined;
  has_discount?: string | undefined;
  min_price?: string | undefined;
  max_price?: string | undefined;
  product_type?: string | undefined;
  tag?: string | undefined;
  article?: string | undefined;
  sort?: string | undefined;
  view?: string | undefined;
}

export const buildCatalogHref = (params: CatalogUrlParams): string => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      query.set(key, value);
    }
  });

  const queryString = query.toString();

  return queryString ? `${ROUTES.CATALOG}?${queryString}` : ROUTES.CATALOG;
};
