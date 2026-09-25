"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { toast } from "sonner";
import { favoriteApi } from "../api/favoriteApi";
import { cartApi } from "@/entities/cart";
import type { FavoriteProductResponse } from "../types";
import { notifyFavoritesChanged } from "@/shared/lib/favorite-events";
import { notifyCartChanged } from "@/shared/lib/cart-events";
import { useIsHydrated } from "@/shared/lib/hooks";

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
          toast.success('«' + product.name + '» добавлен в избранное');
          return true;
        } catch {
          // If 409 already exists, keep it
          set({ pendingProductId: null });
          return true;
        }
      },

      removeFavorite: async (productId: number, productName?: string) => {
        const token = getAccessToken();
        const prevItems = get().items;
        const target = prevItems.find((it) => it.id === productId);
        const name = productName || target?.name || "Товар";

        // Optimistic removal
        const nextItems = prevItems.filter((it) => it.id !== productId);
        set({ items: nextItems, pendingProductId: productId, errorMessage: null });
        notifyFavoritesChanged({ itemsCount: nextItems.length });

        try {
          await favoriteApi.remove(productId, token);
          set({ pendingProductId: null });
          toast('«' + name + '» удален из избранного');
          return true;
        } catch {
          set({ items: prevItems, pendingProductId: null, errorMessage: "Не удалось удалить из избранного" });
          toast.error("Не удалось удалить из избранного");
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
          toast.success("Избранное очищено");
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

        if (addedCount > 0) {
          toast.success(
            'Добавлено в корзину: ' + addedCount + ' ' + (addedCount === 1 ? 'товар' : 'товаров'),
            {
              action: {
                label: "В корзину",
                onClick: () => {
                  if (typeof window !== "undefined") {
                    window.location.assign("/cart");
                  }
                },
              },
            },
          );
        } else if (failedCount > 0) {
          toast.error("Не удалось добавить товары в корзину");
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
