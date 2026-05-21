"use client";

import { useState, useTransition } from "react";
import { Heart, ShoppingCart } from "lucide-react";
import { cartApi } from "@/entities/cart";
import { favoriteApi } from "@/entities/favorite";
import { cn } from "@/shared/config";

interface CatalogCartButtonProps {
  productId: number;
  productName: string;
  initialInCart: boolean;
}

export const CatalogCartButton = ({
  initialInCart,
  productId,
  productName,
}: CatalogCartButtonProps) => {
  const [isInCart, setIsInCart] = useState(initialInCart);
  const [isPending, startTransition] = useTransition();

  const handleAddToCart = (): void => {
    startTransition(async () => {
      try {
        await cartApi.addItem({
          product_id: productId,
          quantity: 1,
        });
        setIsInCart(true);
      } catch {
        setIsInCart(false);
      }
    });
  };

  return (
    <button
      className={cn(
        "grid size-10 place-items-center rounded-lg text-white transition",
        isInCart ? "bg-accent-hover" : "bg-accent-primary hover:bg-accent-hover",
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
      } catch {
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
