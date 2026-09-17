"use client";

import { useState, useTransition } from "react";
import { Heart, ShoppingCart } from "lucide-react";
import { cartApi } from "@/entities/cart";
import { favoriteApi } from "@/entities/favorite";
import { isApiErrorStatus } from "@/shared/api";
import { cn } from "@/shared/config";
import { notifyCartChanged } from "@/shared/lib/cart-events";
import { notifyFavoritesChanged } from "@/shared/lib/favorite-events";

interface CatalogCartButtonProps {
  productId: number;
  productName: string;
  initialInCart: boolean;
  minQuantity?: number | string | null | undefined;
}

export const CatalogCartButton = ({
  initialInCart,
  productId,
  productName,
  minQuantity,
}: CatalogCartButtonProps) => {
  const [isInCart, setIsInCart] = useState(initialInCart);
  const [isPending, startTransition] = useTransition();

  const handleAddToCart = (): void => {
    const qty = minQuantity ? Number(minQuantity) : 1;
    const finalQuantity = Number.isFinite(qty) && qty > 0 ? (Number.isInteger(qty) ? qty : qty.toFixed(1)) : 1;

    startTransition(async () => {
      try {
        const response = await cartApi.addItem({
          product_id: productId,
          quantity: finalQuantity,
        });
        notifyCartChanged({ itemsCount: response.cart.items_count });
        setIsInCart(true);
      } catch {
        setIsInCart(false);
      }
    });
  };

  return (
    <button
      className={cn(
        "grid size-11 place-items-center rounded-lg text-white transition-all duration-150 active:scale-90 select-none",
        isInCart ? "bg-accent-hover shadow-xs" : "bg-accent-primary hover:bg-accent-hover shadow-soft",
        isPending && "cursor-wait opacity-70",
      )}
      type="button"
      disabled={isPending}
      onClick={handleAddToCart}
      aria-label={`Добавить ${productName} в корзину`}
    >
      <ShoppingCart size={18} />
    </button>
  );
};

interface CatalogFavoriteButtonProps {
  productId: number;
  productName: string;
  initialFavorite: boolean;
}

export const CatalogFavoriteButton = ({
  initialFavorite,
  productId,
  productName,
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
        "absolute top-3 right-3 transition",
        isFavorite ? "text-error" : "text-text-muted hover:text-error",
        isPending && "cursor-wait opacity-70",
      )}
      type="button"
      disabled={isPending}
      onClick={handleToggleFavorite}
      aria-label={
        isFavorite ? `Убрать ${productName} из избранного` : `Добавить ${productName} в избранное`
      }
    >
      <Heart fill={isFavorite ? "currentColor" : "none"} size={20} />
    </button>
  );
};
