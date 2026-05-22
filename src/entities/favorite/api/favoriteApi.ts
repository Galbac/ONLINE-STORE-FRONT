import { apiClient, API_ENDPOINTS } from "@/shared/api";
import type { FavoriteActionResponse, FavoritesResponse } from "../types";

const getAuthHeaders = (accessToken?: string | null): HeadersInit | undefined => {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined;
};

export const favoriteApi = {
  getList: async (
    params: { page?: number; limit?: number } = { page: 1, limit: 100 },
    accessToken?: string | null,
  ): Promise<FavoritesResponse> => {
    return apiClient.get<FavoritesResponse>(
      API_ENDPOINTS.FAVORITE.LIST,
      {
        page: params.page,
        limit: params.limit,
      },
      getAuthHeaders(accessToken),
    );
  },

  add: async (productId: number, accessToken?: string | null): Promise<FavoriteActionResponse> => {
    return apiClient.post<undefined, FavoriteActionResponse>(
      API_ENDPOINTS.FAVORITE.BY_PRODUCT_ID(productId),
      undefined,
      getAuthHeaders(accessToken),
    );
  },

  remove: async (
    productId: number,
    accessToken?: string | null,
  ): Promise<FavoriteActionResponse> => {
    return apiClient.delete<FavoriteActionResponse>(
      API_ENDPOINTS.FAVORITE.BY_PRODUCT_ID(productId),
      undefined,
      getAuthHeaders(accessToken),
    );
  },
};
