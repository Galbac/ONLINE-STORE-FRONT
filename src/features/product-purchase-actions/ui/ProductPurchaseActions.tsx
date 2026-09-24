"use client";

import { useState, useTransition } from "react";
import { Heart, Minus, Plus, ShoppingCart } from "lucide-react";
import { cartApi } from "@/entities/cart";
import { favoriteApi } from "@/entities/favorite";
import { isApiErrorStatus } from "@/shared/api";
import { cn } from "@/shared/config";
import { notifyCartChanged } from "@/shared/lib/cart-events";
import { notifyFavoritesChanged } from "@/shared/lib/favorite-events";
import { toPriceFormat } from "@/shared/lib/format";

interface ProductPurchaseActionsProps {
  productId: number;
  productName: string;
  price: string;
  oldPrice?: string | null | undefined;
  discountPercent?: number | null | undefined;
  minQuantity: string;
  quantityStep: string;
  stockQuantity: string;
  unit: string;
  isAvailable: boolean;
  initialFavorite: boolean;
}

export const ProductPurchaseActions = ({
  discountPercent,
  initialFavorite,
  isAvailable,
  minQuantity,
  oldPrice,
  price,
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
  const [isCartPending, startCartTransition] = useTransition();
  const [isFavoritePending, startFavoriteTransition] = useTransition();

  const currentTotal = Number((Number(price) * quantity).toFixed(2));
  const currentOldTotal = oldPrice ? Number((Number(oldPrice) * quantity).toFixed(2)) : null;



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


      notifyCartChanged({ itemsCount: response.cart.items_count });
    });
  };

  const handleToggleFavorite = (): void => {
    startFavoriteTransition(async () => {
      const nextValue = !isFavorite;

      if (nextValue) {
        await favoriteApi.add(productId).catch((error: unknown) => {
          if (isApiErrorStatus(error, 409)) {
            return;
          }

          throw error;
        });
      } else {
        await favoriteApi.remove(productId);
      }

      setIsFavorite(nextValue);
      notifyFavoritesChanged();
    });
  };

  return (
    <div className="space-y-5">
      {/* Dynamic Price Block calculated per selected quantity */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50/70 to-teal-50/40 p-5 shadow-2xs">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none">
            {toPriceFormat(currentTotal)}
          </span>
          {currentOldTotal ? (
            <span className="text-lg text-slate-400 line-through leading-none font-medium">
              {toPriceFormat(currentOldTotal)}
            </span>
          ) : null}
          {discountPercent ? (
            <span className="rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 px-3 py-1 text-xs font-black text-white shadow-xs">
              -{discountPercent}%
            </span>
          ) : null}
        </div>
        <div className="rounded-xl bg-white/90 border border-emerald-200/60 px-3.5 py-1.5 text-xs font-bold text-emerald-800 shadow-2xs">
          {toPriceFormat(price)} / {unit}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-bold text-slate-600 uppercase tracking-wider">Количество для заказа</p>
        <div className="grid gap-3 sm:grid-cols-[170px_minmax(180px,1fr)]">
          <div className="flex h-12 items-center justify-between overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
            <button
              className="grid h-full w-12 place-items-center hover:bg-slate-50 transition active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
              type="button"
              disabled={!canDecrease || isCartPending}
              onClick={handleDecrease}
              aria-label={`Уменьшить количество ${productName}`}
            >
              <Minus size={18} />
            </button>
            <span className="text-base font-extrabold text-slate-900">
              {formatQuantityValue(quantity)} {unitLabel(unit)}
            </span>
            <button
              className="grid h-full w-12 place-items-center hover:bg-slate-50 transition active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
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
              "flex h-12 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-base font-bold text-white shadow-sm shadow-emerald-700/20 transition-all hover:bg-emerald-700 hover:scale-[1.01] active:scale-98 disabled:cursor-not-allowed disabled:opacity-55",
              isCartPending && "cursor-wait opacity-75",
            )}
            type="button"
            disabled={!isAvailable || isCartPending}
            onClick={handleAddToCart}
          >
            <ShoppingCart size={18} />
            {isCartPending ? "Добавление..." : "В корзину"}
          </button>
        </div>
      </div>

      <button
        className={cn(
          "flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-base font-bold shadow-2xs transition hover:bg-slate-50 active:scale-98",
          isFavorite ? "text-rose-500 border-rose-200 bg-rose-50/50" : "text-slate-700",
          isFavoritePending && "cursor-wait opacity-75",
        )}
        type="button"
        disabled={isFavoritePending}
        onClick={handleToggleFavorite}
      >
        <Heart fill={isFavorite ? "currentColor" : "none"} size={20} />
        {isFavorite ? "В избранном" : "В избранное"}
      </button>
    </div>
  );
};



const toPositiveNumber = (value: string | number | null | undefined, fallback: number): number => {
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

const unitLabel = (unit?: string | null): string => {
  if (!unit) return "";
  const firstPart = unit.split(" ")[1];

  return firstPart ?? unit;
};


