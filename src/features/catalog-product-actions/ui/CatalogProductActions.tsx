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

interface CatalogCartButtonProps {
  productId: number;
  productName: string;
  initialInCart: boolean;
  minQuantity?: number | string | null | undefined;
  quantityStep?: number | string | null | undefined;
  className?: string;
  showText?: boolean;
}

export const CatalogCartButton = ({
  initialInCart,
  productId,
  productName,
  minQuantity,
  quantityStep,
  className,
  showText = false,
}: CatalogCartButtonProps) => {
  const step = quantityStep ? Number(quantityStep) : 1;
  const minQty = minQuantity ? Number(minQuantity) : (Number.isFinite(step) && step > 0 ? step : 1);
  const [quantity, setQuantity] = useState<number>(initialInCart ? minQty : 0);
  const [cartItemId, setCartItemId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleAddToCart = (): void => {
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
      }
    });
  };

  const triggerHaptic = () => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try { navigator.vibrate(15); } catch (_) {}
    }
  };

  const handleIncrement = (): void => {
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
    return (
      <div
        className={cn(
          "flex h-10 items-center justify-between rounded-xl bg-emerald-600 px-1 text-white shadow-xs shadow-emerald-700/20 transition-all select-none min-w-[96px]",
          showText && "h-12 px-2 min-w-[140px] text-sm",
          className,
          isPending && "opacity-75 cursor-wait",
        )}
      >
        <button
          type="button"
          disabled={isPending}
          onClick={handleDecrement}
          className={cn(
            "flex size-7 items-center justify-center rounded-lg hover:bg-emerald-700 active:scale-90 transition",
            showText && "size-8",
          )}
          aria-label={`Уменьшить количество ${productName}`}
        >
          <Minus size={showText ? 16 : 14} />
        </button>
        <span className={cn("text-xs font-extrabold px-1 tracking-tight", showText && "text-sm font-bold px-2")}>
          {quantity}
        </span>
        <button
          type="button"
          disabled={isPending}
          onClick={handleIncrement}
          className={cn(
            "flex size-7 items-center justify-center rounded-lg hover:bg-emerald-700 active:scale-90 transition",
            showText && "size-8",
          )}
          aria-label={`Увеличить количество ${productName}`}
        >
          <Plus size={showText ? 16 : 14} />
        </button>
      </div>
    );
  }

  return (
    <button
      className={cn(
        "flex size-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-700/20 transition-all hover:scale-105 hover:bg-emerald-700 active:scale-95 select-none",
        showText && "h-12 px-6 w-auto gap-2.5 text-sm font-bold shadow-md shadow-emerald-600/20 hover:scale-[1.02]",
        className,
        isPending && "cursor-wait opacity-70",
      )}
      type="button"
      disabled={isPending}
      onClick={handleAddToCart}
      aria-label={`Добавить ${productName} в корзину`}
    >
      <ShoppingCart size={18} />
      {showText && <span>В корзину</span>}
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
