"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { favoriteApi } from "../api/favoriteApi";
import { cartApi } from "@/entities/cart";
import type { FavoriteProductResponse } from "../types";
import { notifyFavoritesChanged } from "@/shared/lib/favorite-events";
import { notifyCartChanged } from "@/shared/lib/cart-events";
import { useIsHydrated } from "@/shared/lib/hooks";
import { extractErrorMessage } from "@/shared/api";

export interface FavoriteState {
  items: FavoriteProductResponse[];
  isLoading: boolean;
  pendingProductId: number | null;
  isClearing: boolean;
  isAddingAllToCart: boolean;
  errorMessage: string | null;
  _hasHydrated: boolean;

  setHasHydrated: (hydrated: boolean) => void;
  fetchFavorites: () => Promise<void>;
  addFavorite: (product: FavoriteProductResponse) => Promise<boolean>;
  removeFavorite: (productId: number, productName?: string) => Promise<boolean>;
  toggleFavorite: (product: FavoriteProductResponse) => Promise<boolean>;
  toggleFavoriteById: (productId: number, productName?: string, extra?: Partial<FavoriteProductResponse>) => Promise<boolean>;
  clearFavorites: () => Promise<void>;
  addAllToCart: () => Promise<{ addedCount: number; failedCount: number }>;
  isFavorite: (productId: number) => boolean;
  setItems: (items: FavoriteProductResponse[]) => void;
}

const getAccessToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return (
    window.localStorage.getItem("access_token") ??
    window.sessionStorage.getItem("access_token")
  );
};

export const useFavoritesStore = create<FavoriteState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      pendingProductId: null,
      isClearing: false,
      isAddingAllToCart: false,
      errorMessage: null,
      _hasHydrated: false,

      setHasHydrated: (hydrated: boolean) => {
        set({ _hasHydrated: hydrated });
      },

      setItems: (items: FavoriteProductResponse[]) => {
        set({ items });
        notifyFavoritesChanged({ itemsCount: items.length });
      },

      isFavorite: (productId: number): boolean => {
        return get().items.some((it) => it.id === productId);
      },

      fetchFavorites: async () => {
        const token = getAccessToken();
        if (!token) {
          return;
        }

        set({ isLoading: true, errorMessage: null });
        try {
          const response = await favoriteApi.getList({ page: 1, limit: 100 }, token);
          set({ items: response.items, isLoading: false });
          notifyFavoritesChanged({ itemsCount: response.items.length });
        } catch {
          set({ isLoading: false });
        }
      },

      addFavorite: async (product: FavoriteProductResponse) => {
        const token = getAccessToken();
        const prevItems = get().items;
        if (prevItems.some((it) => it.id === product.id)) {
          return true;
        }

        // Optimistic update
        const nextItems = [product, ...prevItems];
        set({ items: nextItems, pendingProductId: product.id, errorMessage: null });
        notifyFavoritesChanged({ itemsCount: nextItems.length });

        try {
          await favoriteApi.add(product.id, token);
          set({ pendingProductId: null });
          return true;
        } catch {
          // If 409 already exists, keep it
          set({ pendingProductId: null });
          return true;
        }
      },

      removeFavorite: async (productId: number, _productName?: string) => {
        const token = getAccessToken();
        const prevItems = get().items;
                
        // Optimistic removal
        const nextItems = prevItems.filter((it) => it.id !== productId);
        set({ items: nextItems, pendingProductId: productId, errorMessage: null });
        notifyFavoritesChanged({ itemsCount: nextItems.length });

        try {
          await favoriteApi.remove(productId, token);
          set({ pendingProductId: null });
          return true;
        } catch (error: unknown) {
          set({ items: prevItems, pendingProductId: null, errorMessage: extractErrorMessage(error, "Не удалось удалить из избранного") });
          return false;
        }
      },

      toggleFavorite: async (product: FavoriteProductResponse) => {
        if (get().isFavorite(product.id)) {
          return get().removeFavorite(product.id, product.name);
        } else {
          return get().addFavorite(product);
        }
      },

      toggleFavoriteById: async (productId: number, productName?: string, extra?: Partial<FavoriteProductResponse>) => {
        if (get().isFavorite(productId)) {
          return get().removeFavorite(productId, productName);
        } else {
          const minimalProduct: FavoriteProductResponse = {
            id: productId,
            name: productName || "Товар",
            slug: extra?.slug ?? `product-${productId}`,
            price: extra?.price ?? "0",
            unit: extra?.unit ?? "шт",
            product_type: extra?.product_type ?? "simple",
            is_available: extra?.is_available ?? true,
            stock_display: extra?.stock_display ?? "В наличии",
            ...extra,
          };
          return get().addFavorite(minimalProduct);
        }
      },

      clearFavorites: async () => {
        const token = getAccessToken();
        const prevItems = get().items;
        if (prevItems.length === 0) return;

        set({ isClearing: true, errorMessage: null, items: [] });
        notifyFavoritesChanged({ itemsCount: 0 });

        try {
          await Promise.all(
            prevItems.map((prod) => favoriteApi.remove(prod.id, token).catch(() => null)),
          );
          set({ isClearing: false });
        } catch {
          set({ isClearing: false });
        }
      },

      addAllToCart: async () => {
        const items = get().items;
        if (items.length === 0) {
          return { addedCount: 0, failedCount: 0 };
        }

        set({ isAddingAllToCart: true, errorMessage: null });
        let addedCount = 0;
        let failedCount = 0;
        let latestCartItemsCount = 0;

        for (const item of items) {
          try {
            const step = item.quantity_step ? Number(item.quantity_step) : 1;
            const res = await cartApi.addItem({
              product_id: item.id,
              quantity: Number.isFinite(step) && step > 0 ? step : 1,
            });
            latestCartItemsCount = res.cart.items_count;
            addedCount++;
          } catch {
            failedCount++;
          }
        }

        set({ isAddingAllToCart: false });

        if (latestCartItemsCount > 0) {
          notifyCartChanged({ itemsCount: latestCartItemsCount });
        }

        return { addedCount, failedCount };
      },
    }),
    {
      name: "pobeda_favorites_store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

/**
 * Hydration-safe selector for useFavoritesStore to eliminate Next.js Hydration Mismatch.
 */
export function useFavoritesHydrated<T>(
  selector: (state: FavoriteState) => T,
  fallback: T,
): T {
  const isHydrated = useIsHydrated();
  const storeValue = useFavoritesStore(selector);
  return isHydrated ? storeValue : fallback;
}
