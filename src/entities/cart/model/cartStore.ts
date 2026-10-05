"use client";

import { toast } from "sonner";

import { useStoreBranch } from "@/entities/delivery";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { safeJsonStorage } from "@/shared/lib/safe-storage";
import { cartApi } from "../api/cartApi";
import { favoriteApi } from "@/entities/favorite";
import type {
  CartItemResponse,
  CartResponse,
  CartSummaryResponse,
} from "../types";
import { emptyCartResponse, emptyCartSummaryResponse } from "../lib/emptyCart";
import { notifyCartChanged } from "@/shared/lib/cart-events";
import { notifyFavoritesChanged } from "@/shared/lib/favorite-events";
import { useIsHydrated } from "@/shared/lib/hooks";
import { extractErrorMessage } from "@/shared/api";

export interface CartState {
  cart: CartResponse;
  summary: CartSummaryResponse;
  freeDeliveryThreshold: number;
  isLoading: boolean;
  pendingAction: string | null;
  errorMessage: string | null;
  _hasHydrated: boolean;

  setHasHydrated: (hydrated: boolean) => void;
  setFreeDeliveryThreshold: (threshold: number) => void;
  fetchCart: () => Promise<void>;
  addItem: (params: {
    product_id: number;
    quantity: number | string;
    name?: string;
  }) => Promise<boolean>;
  updateQuantity: (
    cartItemId: number,
    quantity: number,
    item?: CartItemResponse,
  ) => Promise<void>;
  removeItem: (cartItemId: number, productName?: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyPromoCode: (code: string) => Promise<{ success: boolean; message: string }>;
  removePromoCode: () => Promise<{ success: boolean; message: string }>;
  moveToFavorites: (item: CartItemResponse) => Promise<void>;
  setCart: (cart: CartResponse, summary: CartSummaryResponse) => void;
}
const DEFAULT_FREE_DELIVERY_THRESHOLD = 3000;

export const useCartStore = create<CartState>()(
  persist(
    (setState, get) => {
      const set = setState;
      return {
      cart: emptyCartResponse,
      summary: emptyCartSummaryResponse,
      freeDeliveryThreshold: DEFAULT_FREE_DELIVERY_THRESHOLD,
      isLoading: false,
      pendingAction: null,
      errorMessage: null,
      _hasHydrated: false,

      setHasHydrated: (hydrated: boolean) => {
        set({ _hasHydrated: hydrated });
      },

      setFreeDeliveryThreshold: (threshold: number) => {
        if (Number.isFinite(threshold) && threshold > 0) {
          set({ freeDeliveryThreshold: threshold });
        }
      },

      setCart: (cart: CartResponse, summary: CartSummaryResponse) => {
        set({ cart, summary });
        notifyCartChanged({ itemsCount: summary.items_count });
      },

      fetchCart: async () => {
        const storeId = useStoreBranch.getState().selectedStore?.id;
        const set = (patch: Partial<CartState>) => {
          if (storeId === useStoreBranch.getState().selectedStore?.id) setState(patch);
        };
        set({ isLoading: true, errorMessage: null });
        try {
          const [cart, summary] = await Promise.all([
            cartApi.get(),
            cartApi.getSummary(),
          ]);
          set({ cart, summary, isLoading: false });
          if (storeId === useStoreBranch.getState().selectedStore?.id) notifyCartChanged({ itemsCount: summary.items_count });
        } catch {
          set({ isLoading: false });
        }
      },

      addItem: async ({product_id, quantity}) => {
        const storeId = useStoreBranch.getState().selectedStore?.id;
        const set = (patch: Partial<CartState>) => {
          if (storeId === useStoreBranch.getState().selectedStore?.id) setState(patch);
        };
        set({ pendingAction: 'add-' + product_id, errorMessage: null });
        try {
          const res = await cartApi.addItem({ product_id, quantity });
          const nextSummary = await cartApi.getSummary().catch(() => ({
            ...get().summary,
            items_count: res.cart.items_count,
            final_price: res.cart.final_price,
            subtotal: res.cart.subtotal,
          }));

          set({
            cart: res.cart,
            summary: nextSummary,
            pendingAction: null,
          });

          if (storeId === useStoreBranch.getState().selectedStore?.id) notifyCartChanged({ itemsCount: res.cart.items_count });
          
          return true;
        } catch (error: unknown) {
          const msg = extractErrorMessage(error, "Не удалось добавить товар в корзину");
          set({
            pendingAction: null,
            errorMessage: msg,
          });
          toast.error(msg);
          return false;
        }
      },

      updateQuantity: async (cartItemId: number, quantity: number, item?: CartItemResponse) => {
        const storeId = useStoreBranch.getState().selectedStore?.id;
        const set = (patch: Partial<CartState>) => {
          if (storeId === useStoreBranch.getState().selectedStore?.id) setState(patch);
        };
        if (quantity <= 0) {
          return get().removeItem(cartItemId, item?.name);
        }

        const prevCart = get().cart;
        const prevSummary = get().summary;

        const updatedItems = prevCart.items.map((it) => {
          if (it.id === cartItemId) {
            const numPrice = Number(it.price) || 0;
            const itemFinalPrice = (numPrice * quantity).toFixed(2);
            return {
              ...it,
              quantity: String(quantity),
              total_price: itemFinalPrice,
              final_price: itemFinalPrice,
            };
          }
          return it;
        });

        const newSubtotal = updatedItems
          .reduce((sum, it) => sum + Number(it.final_price || 0), 0)
          .toFixed(2);

        set({
          pendingAction: 'quantity-' + cartItemId,
          cart: {
            ...prevCart,
            items: updatedItems,
            subtotal: newSubtotal,
            final_price: newSubtotal,
          },
          summary: {
            ...prevSummary,
            subtotal: newSubtotal,
            final_price: newSubtotal,
          },
        });

        try {
          const normalizedQty = Number.isInteger(quantity)
            ? quantity
            : Number(quantity.toFixed(2));
          const response = await cartApi.updateItem(cartItemId, {
            quantity: normalizedQty,
          });
          const nextSummary = await cartApi.getSummary();

          set({
            cart: response.cart,
            summary: nextSummary,
            pendingAction: null,
          });
          if (storeId === useStoreBranch.getState().selectedStore?.id) notifyCartChanged({ itemsCount: nextSummary.items_count });
        } catch (error: unknown) {
          const msg = extractErrorMessage(error, "Не удалось обновить количество");
          set({
            cart: prevCart,
            summary: prevSummary,
            pendingAction: null,
            errorMessage: msg,
          });
          toast.error(msg);
        }
      },

      removeItem: async (cartItemId: number, _productName?: string) => {
        const storeId = useStoreBranch.getState().selectedStore?.id;
        const set = (patch: Partial<CartState>) => {
          if (storeId === useStoreBranch.getState().selectedStore?.id) setState(patch);
        };
        const prevCart = get().cart;
        const prevSummary = get().summary;

        const nextItems = prevCart.items.filter((it) => it.id !== cartItemId);
        const newCount = nextItems.length;
        const newSubtotal = nextItems
          .reduce((sum, it) => sum + Number(it.final_price || 0), 0)
          .toFixed(2);

        set({
          pendingAction: 'delete-' + cartItemId,
          cart: {
            ...prevCart,
            items: nextItems,
            items_count: newCount,
            subtotal: newSubtotal,
            final_price: newSubtotal,
          },
          summary: {
            ...prevSummary,
            items_count: newCount,
            subtotal: newSubtotal,
            final_price: newSubtotal,
          },
        });
        notifyCartChanged({ itemsCount: newCount });

        try {
          const response = await cartApi.deleteItem(cartItemId);
          const nextSummary = await cartApi.getSummary();

          set({
            cart: response.cart,
            summary: nextSummary,
            pendingAction: null,
          });
          if (storeId === useStoreBranch.getState().selectedStore?.id) notifyCartChanged({ itemsCount: nextSummary.items_count });
        } catch (error: unknown) {
          const msg = extractErrorMessage(error, "Не удалось удалить товар");
          set({
            cart: prevCart,
            summary: prevSummary,
            pendingAction: null,
            errorMessage: msg,
          });
          toast.error(msg);
        }
      },

      clearCart: async () => {
        const storeId = useStoreBranch.getState().selectedStore?.id;
        const set = (patch: Partial<CartState>) => {
          if (storeId === useStoreBranch.getState().selectedStore?.id) setState(patch);
        };
        set({ pendingAction: 'clear', errorMessage: null });
        try {
          const res = await cartApi.clear();
          const summary = await cartApi.getSummary().catch(() => emptyCartSummaryResponse);
          set({
            cart: res.cart,
            summary,
            pendingAction: null,
          });
          if (storeId === useStoreBranch.getState().selectedStore?.id) notifyCartChanged({ itemsCount: 0 });
        } catch (error: unknown) {
          const msg = extractErrorMessage(error, "Не удалось очистить корзину");
          set({
            pendingAction: null,
            errorMessage: msg,
          });
          toast.error(msg);
        }
      },

      applyPromoCode: async (code: string) => {
        const storeId = useStoreBranch.getState().selectedStore?.id;
        const set = (patch: Partial<CartState>) => {
          if (storeId === useStoreBranch.getState().selectedStore?.id) setState(patch);
        };
        set({ pendingAction: 'promo-apply', errorMessage: null });
        try {
          const response = await cartApi.applyPromoCodeToCart({ code });
          const nextSummary = await cartApi.getSummary();
          set({
            cart: response.cart,
            summary: nextSummary,
            pendingAction: null,
          });
          
          return { success: true, message: response.message || "Промокод применен" };
        } catch (error: unknown) {
          const message = extractErrorMessage(error, "Не удалось применить промокод");
          set({
            pendingAction: null,
            errorMessage: message,
          });
          toast.error(message);
          return { success: false, message };
        }
      },

      removePromoCode: async () => {
        const storeId = useStoreBranch.getState().selectedStore?.id;
        const set = (patch: Partial<CartState>) => {
          if (storeId === useStoreBranch.getState().selectedStore?.id) setState(patch);
        };
        set({ pendingAction: 'promo-remove', errorMessage: null });
        try {
          const response = await cartApi.removePromoCode();
          const nextSummary = await cartApi.getSummary();
          set({
            cart: response.cart,
            summary: nextSummary,
            pendingAction: null,
          });
          
          return { success: true, message: response.message || "Промокод удален" };
        } catch (error: unknown) {
          const message = extractErrorMessage(error, "Не удалось удалить промокод");
          set({
            pendingAction: null,
            errorMessage: message,
          });
          
          return { success: false, message };
        }
      },

      moveToFavorites: async (item: CartItemResponse) => {
        const storeId = useStoreBranch.getState().selectedStore?.id;
        const set = (patch: Partial<CartState>) => {
          if (storeId === useStoreBranch.getState().selectedStore?.id) setState(patch);
        };
        set({ pendingAction: 'fav-' + item.id });
        try {
          await favoriteApi.add(item.product_id);
          if (storeId === useStoreBranch.getState().selectedStore?.id) notifyFavoritesChanged();
          if (storeId === useStoreBranch.getState().selectedStore?.id) await get().removeItem(item.id, item.name);
          
        } catch {
          set({ pendingAction: null });
          
        }
      },
      };
    },
    {
      name: "pobeda_cart_store",
      storage: safeJsonStorage(),
      version: 1,
      migrate: () => ({}),
      partialize: (state) => ({
        freeDeliveryThreshold: state.freeDeliveryThreshold,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);

export function useCartHydrated<T>(selector: (state: CartState) => T, fallback: T): T {
  const isHydrated = useIsHydrated();
  const storeValue = useCartStore(selector);
  return isHydrated ? storeValue : fallback;
}
