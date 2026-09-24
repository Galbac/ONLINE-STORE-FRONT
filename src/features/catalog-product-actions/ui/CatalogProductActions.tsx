"use client";

import { useState, useTransition } from "react";
import { Heart, Minus, Plus, ShoppingCart } from "lucide-react";
import { cartApi } from "@/entities/cart";
import { favoriteApi } from "@/entities/favorite";
import { isApiErrorStatus } from "@/shared/api";
import { cn } from "@/shared/config";
import { notifyCartChanged } from "@/shared/lib/cart-events";
import { toast } from "sonner";
import { openCartDrawer } from "@/widgets/cart-drawer";
import { notifyFavoritesChanged } from "@/shared/lib/favorite-events";
import { isAccessTokenValid } from "@/shared/lib/auth-token";

interface CatalogCartButtonProps {
  productId: number;
  productName: string;
  initialInCart: boolean;
  minQuantity?: number | string | null | undefined;
  quantityStep?: number | string | null | undefined;
  unit?: string | null | undefined;
  className?: string;
  showText?: boolean;
}

export const CatalogCartButton = ({
  initialInCart,
  productId,
  productName,
  minQuantity,
  quantityStep,
  unit,
  className,
  showText = false,
}: CatalogCartButtonProps) => {
  const step = quantityStep ? Number(quantityStep) : 1;
  const minQty = minQuantity ? Number(minQuantity) : (Number.isFinite(step) && step > 0 ? step : 1);
  const [quantity, setQuantity] = useState<number>(initialInCart ? minQty : 0);
  const [cartItemId, setCartItemId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const checkAuth = (): boolean => {
    const token = typeof window !== "undefined"
      ? (window.localStorage.getItem("access_token") ?? window.sessionStorage.getItem("access_token"))
      : null;
    if (!token || !isAccessTokenValid(token)) {
      toast.error("Войдите в аккаунт, чтобы добавить товар в корзину", {
        action: {
          label: "Войти",
          onClick: () => {
            if (typeof window !== "undefined") {
              window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
            }
          },
        },
      });
      return false;
    }
    return true;
  };

  const handleAddToCart = (): void => {
    if (!checkAuth()) return;

    const qty = minQty;
    const finalQuantity = Number.isFinite(qty) && qty > 0 ? (Number.isInteger(qty) ? qty : Number(qty.toFixed(2))) : 1;

    startTransition(async () => {
      try {
        const response = await cartApi.addItem({
          product_id: productId,
          quantity: finalQuantity,
        });
        const matched = response.cart.items.find((it) => it.product_id === productId);
        if (matched) {
          setCartItemId(matched.id);
          setQuantity(Number(matched.quantity));
        } else {
          setQuantity(finalQuantity);
        }
        notifyCartChanged({ itemsCount: response.cart.items_count });
        toast.success(`«${productName}» добавлен в корзину`, {
          action: {
            label: "Открыть корзину",
            onClick: () => openCartDrawer(),
          },
        });
      } catch {
        setQuantity(0);
        toast.error(`Не удалось добавить «${productName}» в корзину`);
      }
    });
  };

  const triggerHaptic = () => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try { navigator.vibrate(15); } catch (_) {}
    }
  };

  const handleIncrement = (): void => {
    if (!checkAuth()) return;
    triggerHaptic();
    const prevQty = quantity;
    const nextQty = Number((quantity + step).toFixed(2));
    setQuantity(nextQty); // Optimistic instant update

    startTransition(async () => {
      try {
        if (cartItemId) {
          const response = await cartApi.updateItem(cartItemId, { quantity: nextQty });
          notifyCartChanged({ itemsCount: response.cart.items_count });
        } else {
          const response = await cartApi.addItem({ product_id: productId, quantity: step });
          const matched = response.cart.items.find((it) => it.product_id === productId);
          if (matched) setCartItemId(matched.id);
          notifyCartChanged({ itemsCount: response.cart.items_count });
        }
      } catch {
        setQuantity(prevQty); // Rollback on error
        toast.error(`Не удалось обновить количество для «${productName}»`);
      }
    });
  };

  const handleDecrement = (): void => {
    if (!checkAuth()) return;
    triggerHaptic();
    const prevQty = quantity;
    const nextQty = Number((quantity - step).toFixed(2));
    const isRemove = nextQty <= 0.001;
    setQuantity(isRemove ? 0 : nextQty); // Optimistic instant update

    startTransition(async () => {
      try {
        if (isRemove) {
          if (cartItemId) {
            const response = await cartApi.deleteItem(cartItemId);
            setCartItemId(null);
            notifyCartChanged({ itemsCount: response.cart.items_count });
          }
        } else {
          if (cartItemId) {
            const response = await cartApi.updateItem(cartItemId, { quantity: nextQty });
            notifyCartChanged({ itemsCount: response.cart.items_count });
          }
        }
      } catch {
        setQuantity(prevQty); // Rollback on error
        toast.error(`Не удалось уменьшить количество для «${productName}»`);
      }
    });
  };

  if (quantity > 0) {
    const unitLabel = unit ? ` ${unit}` : "";
    return (
      <div
        className={cn(
          "flex h-9 sm:h-9.5 items-center justify-between rounded-xl bg-emerald-600 px-1.5 text-white shadow-xs shadow-emerald-700/20 transition-all select-none min-w-[96px] sm:min-w-[108px] shrink-0",
          showText && "h-12 px-2.5 min-w-[140px] text-sm",
          className,
          isPending && "opacity-75 cursor-wait",
        )}
      >
        <button
          type="button"
          disabled={isPending}
          onClick={handleDecrement}
          className={cn(
            "flex size-6 sm:size-7 items-center justify-center rounded-lg hover:bg-emerald-700 active:scale-90 transition cursor-pointer",
            showText && "size-8",
          )}
          aria-label={`Уменьшить на ${step}${unitLabel} ${productName}`}
        >
          <Minus size={showText ? 16 : 13} />
        </button>
        <span className={cn("text-[11px] sm:text-xs font-extrabold px-1 tracking-tight whitespace-nowrap", showText && "text-sm font-bold px-2")}>
          {quantity}{unitLabel}
        </span>
        <button
          type="button"
          disabled={isPending}
          onClick={handleIncrement}
          className={cn(
            "flex size-6 sm:size-7 items-center justify-center rounded-lg hover:bg-emerald-700 active:scale-90 transition cursor-pointer",
            showText && "size-8",
          )}
          aria-label={`Увеличить на ${step}${unitLabel} ${productName}`}
        >
          <Plus size={showText ? 16 : 13} />
        </button>
      </div>
    );
  }

  return (
    <button
      className={cn(
        "inline-flex h-9 sm:h-9.5 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 sm:px-3.5 text-xs font-bold text-white shadow-sm shadow-emerald-700/20 transition-all hover:bg-emerald-700 active:scale-95 select-none shrink-0 cursor-pointer",
        showText && "h-12 px-6 w-auto gap-2.5 text-sm font-bold shadow-md shadow-emerald-600/20 hover:scale-[1.02]",
        className,
        isPending && "cursor-wait opacity-70",
      )}
      type="button"
      disabled={isPending}
      onClick={handleAddToCart}
      aria-label={`Добавить ${productName} в корзину`}
    >
      <ShoppingCart size={15} className="shrink-0" />
      <span>В корзину</span>
    </button>
  );
};

interface CatalogFavoriteButtonProps {
  productId: number;
  productName: string;
  initialFavorite: boolean;
  className?: string;
}

export const CatalogFavoriteButton = ({
  initialFavorite,
  productId,
  productName,
  className,
}: CatalogFavoriteButtonProps) => {
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [isPending, startTransition] = useTransition();

  const handleToggleFavorite = (): void => {
    startTransition(async () => {
      const nextValue = !isFavorite;

      try {
        if (nextValue) {
          await favoriteApi.add(productId);
        } else {
          await favoriteApi.remove(productId);
        }
        setIsFavorite(nextValue);
        notifyFavoritesChanged();
        toast(nextValue ? `«${productName}» добавлен в избранное` : `«${productName}» удален из избранного`);
      } catch (error) {
        if (nextValue && isApiErrorStatus(error, 409)) {
          setIsFavorite(true);
          notifyFavoritesChanged();
          return;
        }

        setIsFavorite(isFavorite);
      }
    });
  };

  return (
    <button
      className={cn(
        "flex size-7 sm:size-9 items-center justify-center rounded-full bg-white/95 text-slate-400 shadow-sm backdrop-blur-md transition-all hover:scale-110 hover:bg-rose-50 hover:text-rose-500 active:scale-95",
        isFavorite && "text-rose-500",
        isPending && "cursor-wait opacity-70",
        className,
      )}
      type="button"
      disabled={isPending}
      onClick={handleToggleFavorite}
      aria-label={
        isFavorite ? `Убрать ${productName} из избранного` : `Добавить ${productName} в избранное`
      }
    >
      <Heart fill={isFavorite ? "currentColor" : "none"} size={15} className="sm:w-[18px] sm:h-[18px]" />
    </button>
  );
};
