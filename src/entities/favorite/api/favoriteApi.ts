import { apiClient, API_ENDPOINTS } from "@/shared/api";
import type { FavoriteActionResponse, FavoritesResponse } from "../types";

export const favoriteApi = {
  getList: async (): Promise<FavoritesResponse> => {
    return apiClient.get<FavoritesResponse>(API_ENDPOINTS.FAVORITE.LIST, {
      page: 1,
      limit: 100,
    });
  },

  add: async (productId: number): Promise<FavoriteActionResponse> => {
    return apiClient.post<undefined, FavoriteActionResponse>(
      API_ENDPOINTS.FAVORITE.BY_PRODUCT_ID(productId),
    );
  },

  remove: async (productId: number): Promise<FavoriteActionResponse> => {
    return apiClient.delete<FavoriteActionResponse>(
      API_ENDPOINTS.FAVORITE.BY_PRODUCT_ID(productId),
    );
  },
};
