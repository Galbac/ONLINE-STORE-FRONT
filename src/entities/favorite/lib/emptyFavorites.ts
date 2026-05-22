import type { FavoritesResponse } from "../types";

export const emptyFavoritesResponse: FavoritesResponse = {
  items: [],
  total: 0,
  page: 1,
  limit: 100,
  pages: 0,
};
