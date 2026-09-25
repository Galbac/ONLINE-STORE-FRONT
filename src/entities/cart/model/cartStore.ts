"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { toast } from "sonner";
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
const DEFAULT_FREE_DELIVERY_THRESHOLD = 1500;

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
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
        set({ isLoading: true, errorMessage: null });
        try {
          const [cart, summary] = await Promise.all([
            cartApi.get(),
            cartApi.getSummary(),
          ]);
          set({ cart, summary, isLoading: false });
          notifyCartChanged({ itemsCount: summary.items_count });
        } catch {
          set({ isLoading: false });
        }
      },

      addItem: async ({product_id, quantity, name}) => {
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

          notifyCartChanged({ itemsCount: res.cart.items_count });
          toast.success(name ? '«' + name + '» добавлен в корзину' : "Товар добавлен в корзину");
          return true;
        } catch {
          set({
            pendingAction: null,
            errorMessage: "Не удалось добавить товар в корзину",
          });
          toast.error("Не удалось добавить товар в корзину");
          return false;
        }
      },

      updateQuantity: async (cartItemId: number, quantity: number, item?: CartItemResponse) => {
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
          notifyCartChanged({ itemsCount: nextSummary.items_count });
        } catch {
          set({
            cart: prevCart,
            summary: prevSummary,
            pendingAction: null,
            errorMessage: "Не удалось обновить количество",
          });
          toast.error("Не удалось изменить количество товара");
        }
      },

      removeItem: async (cartItemId: number, productName?: string) => {
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
          notifyCartChanged({ itemsCount: nextSummary.items_count });
          toast(productName ? '«' + productName + '» удален из корзины' : 'Товар удален из корзины');
        } catch {
          set({
            cart: prevCart,
            summary: prevSummary,
            pendingAction: null,
            errorMessage: "Не удалось удалить товар",
          });
          toast.error("Не удалось удалить товар");
        }
      },

      clearCart: async () => {
        set({ pendingAction: 'clear', errorMessage: null });
        try {
          const res = await cartApi.clear();
          const summary = await cartApi.getSummary().catch(() => emptyCartSummaryResponse);
          set({
            cart: res.cart,
            summary,
            pendingAction: null,
          });
          notifyCartChanged({ itemsCount: 0 });
          toast.success("Корзина очищена");
        } catch {
          set({
            pendingAction: null,
            errorMessage: "Не удалось очистить корзину",
          });
          toast.error("Ошибка при очистке корзины");
        }
      },

      applyPromoCode: async (code: string) => {
        set({ pendingAction: 'promo-apply', errorMessage: null });
        try {
          const response = await cartApi.applyPromoCodeToCart({ code });
          const nextSummary = await cartApi.getSummary();
          set({
            cart: response.cart,
            summary: nextSummary,
            pendingAction: null,
          });
          toast.success("Промокод успешно применен!");
          return { success: true, message: response.message || "Промокод применен" };
        } catch {
          set({
            pendingAction: null,
            errorMessage: "Неверный или недействительный промокод",
          });
          toast.error("Не удалось применить промокод");
          return { success: false, message: "Не удалось применить промокод" };
        }
      },

      removePromoCode: async () => {
        set({ pendingAction: 'promo-remove', errorMessage: null });
        try {
          const response = await cartApi.removePromoCode();
          const nextSummary = await cartApi.getSummary();
          set({
            cart: response.cart,
            summary: nextSummary,
            pendingAction: null,
          });
          toast.success("Промокод удален");
          return { success: true, message: response.message || "Промокод удален" };
        } catch {
          set({
            pendingAction: null,
            errorMessage: "Не удалось удалить промокод",
          });
          toast.error("Не удалось удалить промокод");
          return { success: false, message: "Не удалось применить промокод" };
        }
      },

      moveToFavorites: async (item: CartItemResponse) => {
        set({ pendingAction: 'fav-' + item.id });
        try {
          await favoriteApi.add(item.product_id);
          notifyFavoritesChanged();
          await get().removeItem(item.id, item.name);
          toast.success('«' + item.name + '» перемещен в избранное');
        } catch {
          set({ pendingAction: null });
          toast.error("Не удалось переместить в избранное");
        }
      },
    }),
    {
      name: "pobeda_cart_store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        cart: state.cart,
        summary: state.summary,
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
