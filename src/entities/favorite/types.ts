import type { ProductShortResponse } from "@/entities/product";

export interface FavoriteActionResponse {
  message: string;
  product_id: number;
}

export type FavoriteProductResponse = ProductShortResponse;

export interface FavoritesResponse {
  items: FavoriteProductResponse[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}
