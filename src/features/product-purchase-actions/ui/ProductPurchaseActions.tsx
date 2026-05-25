"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { ChevronDown, Heart, Minus, Plus, ShoppingCart } from "lucide-react";
import { cartApi, type CartSummaryResponse } from "@/entities/cart";
import { favoriteApi } from "@/entities/favorite";
import { cn, ROUTES } from "@/shared/config";
import { toPriceFormat } from "@/shared/lib/format";
import { notifyCartChanged } from "@/shared/lib/cart-events";

interface ProductPurchaseActionsProps {
  productId: number;
  productName: string;
  minQuantity: string;
  quantityStep: string;
  stockQuantity: string;
  unit: string;
  isAvailable: boolean;
  initialFavorite: boolean;
  cartSummary: CartSummaryResponse;
}

export const ProductPurchaseActions = ({
  cartSummary,
  initialFavorite,
  isAvailable,
  minQuantity,
  productId,
  productName,
  quantityStep,
  stockQuantity,
  unit,
}: ProductPurchaseActionsProps) => {
  const step = toPositiveNumber(quantityStep, 1);
  const min = toPositiveNumber(minQuantity, step);
  const stock = toPositiveNumber(stockQuantity, 0);
  const [quantity, setQuantity] = useState(min);
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [summary, setSummary] = useState(cartSummary);
  const [isCartPending, startCartTransition] = useTransition();
  const [isFavoritePending, startFavoriteTransition] = useTransition();

  useEffect(() => {
    if (!hasStoredAccessToken()) {
      return;
    }

    let isMounted = true;

    const refreshCartSummary = async (): Promise<void> => {
      try {
        const nextSummary = await cartApi.getSummary();

        if (isMounted) {
          setSummary(nextSummary);
        }
      } catch {
        // Auth refresh and redirects are handled by apiClient.
      }
    };

    void refreshCartSummary();

    return () => {
      isMounted = false;
    };
  }, []);

  const canDecrease = quantity - step >= min;
  const canIncrease = stock === 0 || quantity + step <= stock;

  const handleDecrease = (): void => {
    if (canDecrease) {
      setQuantity((currentQuantity) => normalizeQuantity(currentQuantity - step));
    }
  };

  const handleIncrease = (): void => {
    if (canIncrease) {
      setQuantity((currentQuantity) => normalizeQuantity(currentQuantity + step));
    }
  };

  const handleAddToCart = (): void => {
    startCartTransition(async () => {
      const response = await cartApi.addItem({
        product_id: productId,
        quantity: formatQuantityValue(quantity),
      });

      setSummary({
        items_count: response.cart.items_count,
        total_quantity: response.cart.total_quantity,
        subtotal: response.cart.subtotal,
        discount_amount: response.cart.discount_amount,
        promo_discount_amount: response.cart.promo_discount_amount,
        delivery_price: response.cart.delivery_price ?? null,
        final_price: response.cart.final_price,
        has_warnings: response.cart.warnings.length > 0,
        warnings_count: response.cart.warnings.length,
        promo_code: null,
      });
      notifyCartChanged({ itemsCount: response.cart.items_count });
    });
  };

  const handleToggleFavorite = (): void => {
    startFavoriteTransition(async () => {
      const nextValue = !isFavorite;

      if (nextValue) {
        await favoriteApi.add(productId);
      } else {
        await favoriteApi.remove(productId);
      }

      setIsFavorite(nextValue);
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm">Количество</p>
        <div className="grid gap-4 sm:grid-cols-[170px_minmax(180px,1fr)]">
          <div className="border-border flex h-12 items-center justify-between overflow-hidden rounded-lg border">
            <button
              className="hover:bg-bg-hover grid h-full w-12 place-items-center disabled:cursor-not-allowed disabled:opacity-45"
              type="button"
              disabled={!canDecrease || isCartPending}
              onClick={handleDecrease}
              aria-label={`Уменьшить количество ${productName}`}
            >
              <Minus size={18} />
            </button>
            <span className="text-base font-bold">
              {formatQuantityValue(quantity)} {unitLabel(unit)}
            </span>
            <button
              className="hover:bg-bg-hover grid h-full w-12 place-items-center disabled:cursor-not-allowed disabled:opacity-45"
              type="button"
              disabled={!canIncrease || isCartPending}
              onClick={handleIncrease}
              aria-label={`Увеличить количество ${productName}`}
            >
              <Plus size={18} />
            </button>
          </div>
          <button
            className={cn(
              "bg-accent-primary text-accent-contrast hover:bg-accent-hover h-12 rounded-lg px-6 text-base font-bold transition disabled:cursor-not-allowed disabled:opacity-55",
              isCartPending && "cursor-wait opacity-75",
            )}
            type="button"
            disabled={!isAvailable || isCartPending}
            onClick={handleAddToCart}
          >
            В корзину
          </button>
        </div>
      </div>

      <button
        className={cn(
          "border-border hover:bg-bg-hover flex h-12 w-full items-center justify-center gap-2 rounded-lg border text-base font-bold transition",
          isFavorite ? "text-accent-primary" : "text-text-primary",
          isFavoritePending && "cursor-wait opacity-75",
        )}
        type="button"
        disabled={isFavoritePending}
        onClick={handleToggleFavorite}
      >
        <Heart fill={isFavorite ? "currentColor" : "none"} size={20} />
        {isFavorite ? "В избранном" : "В избранное"}
      </button>

      <Link
        className="border-border hover:bg-bg-hover grid min-h-16 grid-cols-[auto_1fr_auto_auto] items-center gap-4 rounded-lg border px-5 transition"
        href={ROUTES.CART}
      >
        <ShoppingCart className="text-accent-primary" size={26} />
        <span>
          <span className="block text-sm font-bold">В корзине</span>
          <span className="text-text-secondary text-sm">
            {summary.items_count} {getProductCountLabel(summary.items_count)}
          </span>
        </span>
        <span className="border-border border-l pl-4">
          <span className="text-text-secondary block text-sm">Сумма</span>
          <span className="font-bold">{toPriceFormat(summary.final_price)}</span>
        </span>
        <ChevronDown size={18} />
      </Link>
    </div>
  );
};

const hasStoredAccessToken = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.localStorage.getItem("access_token") !== null ||
    window.sessionStorage.getItem("access_token") !== null
  );
};

const toPositiveNumber = (value: string, fallback: number): number => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
};

const normalizeQuantity = (value: number): number => {
  return Number(value.toFixed(3));
};

const formatQuantityValue = (value: number): string => {
  return Number.isInteger(value) ? String(value) : String(normalizeQuantity(value));
};

const unitLabel = (unit: string): string => {
  const firstPart = unit.split(" ")[1];

  return firstPart ?? unit;
};

const getProductCountLabel = (count: number): string => {
  const lastTwoDigits = count % 100;
  const lastDigit = count % 10;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return "товаров";
  }

  if (lastDigit === 1) {
    return "товар";
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return "товара";
  }

  return "товаров";
};
