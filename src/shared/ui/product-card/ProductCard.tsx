import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, ShoppingCart, Star } from "lucide-react";
import type { ProductShortResponse } from "@/entities/product";
import { StockAlertButton } from "@/features/catalog-product-actions";
import { QuickViewButton } from "@/features/quick-view";
import { ROUTES } from "@/shared/config";
import { toPriceFormat } from "@/shared/lib/format";

interface ProductCardProps {
  product: ProductShortResponse;
  cartControl?: React.ReactNode;
  favoriteControl?: React.ReactNode;
  variant?: "grid" | "list";
  initialInCart?: boolean;
}

export const ProductCard = ({
  cartControl,
  favoriteControl,
  product,
  variant = "grid",
  initialInCart = false,
}: ProductCardProps) => {
  const isLowStock = product.is_available && product.stock_display.startsWith("Осталось");

  if (variant === "list") {
    return (
      <article className="group relative grid gap-4 rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-slate-900/5 sm:grid-cols-[150px_minmax(0,1fr)] lg:grid-cols-[170px_minmax(0,1fr)_auto]">
        {product.discount_percent ? (
          <span className="absolute top-3 left-3 z-10 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 px-2.5 py-1 text-xs font-black text-white shadow-sm shadow-rose-500/30">
            -{product.discount_percent}%
          </span>
        ) : null}

        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
          <QuickViewButton product={product} initialInCart={initialInCart} />
          {favoriteControl ?? (
            <button
              aria-label={`Добавить ${product.name} в избранное`}
              className="flex size-9 items-center justify-center rounded-full bg-white/95 text-slate-400 shadow-sm backdrop-blur-md transition-all hover:scale-110 hover:bg-rose-50 hover:text-rose-500 active:scale-95"
              type="button"
            >
              <Heart size={18} />
            </button>
          )}
        </div>

        <Link
          className="flex h-36 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-slate-50/80 to-slate-100/40 sm:h-full sm:min-h-36"
          href={ROUTES.PRODUCT(product.slug)}
        >
          {product.preview_image_url ? (
            <Image
              alt={product.name}
              className="h-full w-full object-contain p-3 transition-transform duration-300 group-hover:scale-105"
              height={160}
              src={product.preview_image_url}
              width={220}
            />
          ) : (
            <span className="grid size-20 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
              <ShoppingBag size={32} />
            </span>
          )}
        </Link>

        <div className="min-w-0 pr-8">
          <Link
            className="line-clamp-2 text-base font-bold text-slate-900 transition-colors group-hover:text-emerald-700"
            href={ROUTES.PRODUCT(product.slug)}
          >
            {product.name}
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <span
                className={`size-2 rounded-full ${
                  product.is_available ? (isLowStock ? "bg-amber-500" : "bg-emerald-500") : "bg-rose-400"
                }`}
              />
              <span className={product.is_available ? (isLowStock ? "text-amber-700 font-bold" : "text-emerald-700") : "text-rose-600"}>
                {product.stock_display}
              </span>
            </span>
            <span className="rounded-lg bg-emerald-50/80 px-2 py-0.5 font-semibold text-emerald-800">
              {product.category?.name ?? "Каталог"}
            </span>
            <span className="text-slate-400">•</span>
            <span>{getProductTypeLabel(product.product_type)}</span>
          </div>
        </div>

        <div className="flex items-end justify-between gap-3 lg:min-w-48 lg:flex-col lg:items-end lg:justify-center">
          <div className="flex flex-wrap items-baseline gap-2 lg:justify-end">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {toPriceFormat(product.price)}
            </span>
            {product.old_price ? (
              <span className="text-xs font-medium text-slate-400 line-through">
                {toPriceFormat(product.old_price)}
              </span>
            ) : null}
          </div>
          {!product.is_available ? (
            <StockAlertButton productId={product.id} productName={product.name} />
          ) : (
            cartControl ?? (
              <button
                aria-label={`Добавить ${product.name} в корзину`}
                className="flex size-11 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-700/20 transition-all hover:scale-105 hover:bg-emerald-700 active:scale-95"
                type="button"
              >
                <ShoppingCart size={19} />
              </button>
            )
          )}
        </div>
      </article>
    );
  }

  return (
    <article className="group relative flex min-h-[300px] sm:min-h-[350px] flex-col rounded-2xl border border-slate-200/80 bg-white p-2.5 sm:p-4 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-500/35 hover:shadow-xl hover:shadow-slate-900/5">
      {product.discount_percent ? (
        <span className="absolute top-2.5 left-2.5 sm:top-3.5 sm:left-3.5 z-10 rounded-lg sm:rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-black text-white shadow-sm shadow-rose-500/30">
          -{product.discount_percent}%
        </span>
      ) : null}

      <div className="absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 z-10 flex items-center gap-1 sm:gap-1.5">
        <div className="hidden sm:block">
          <QuickViewButton product={product} initialInCart={initialInCart} />
        </div>
        {favoriteControl ?? (
          <button
            className="flex size-7 sm:size-9 items-center justify-center rounded-full bg-white/95 text-slate-400 shadow-sm backdrop-blur-md transition-all hover:scale-110 hover:bg-rose-50 hover:text-rose-500 active:scale-95"
            type="button"
            aria-label={`Добавить ${product.name} в избранное`}
          >
            <Heart size={15} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        )}
      </div>

      <Link
        className="mb-2 sm:mb-3.5 flex h-32 sm:h-42 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-slate-50/70 to-slate-100/40 p-2 sm:p-3"
        href={ROUTES.PRODUCT(product.slug)}
      >
        {product.preview_image_url ? (
          <Image
            alt={product.name}
            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
            height={160}
            src={product.preview_image_url}
            width={220}
          />
        ) : (
          <span className="grid size-20 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 transition-transform duration-300 group-hover:scale-110">
            <ShoppingBag size={32} />
          </span>
        )}
      </Link>

      <div className="mb-2 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md text-[11px]">
            {product.category?.name ?? "Каталог"}
          </span>
          <span className="inline-flex items-center gap-0.5 text-amber-500 font-bold text-[11px]">
            <Star size={11} className="fill-amber-400 text-amber-400" />
            4.9
          </span>
        </div>
        <span className="inline-flex items-center gap-1 font-medium text-slate-500">
          <span
            className={`size-1.5 rounded-full ${
              product.is_available ? (isLowStock ? "bg-amber-500" : "bg-emerald-500") : "bg-rose-400"
            }`}
          />
          <span className={isLowStock ? "text-amber-700 font-bold text-[11px]" : "text-[11px]"}>
            {product.stock_display}
          </span>
        </span>
      </div>

      <Link
        className="line-clamp-2 min-h-10 text-sm font-bold text-slate-900 transition-colors group-hover:text-emerald-700 leading-snug"
        href={ROUTES.PRODUCT(product.slug)}
      >
        {product.name}
      </Link>

      <div className="mt-auto flex items-end justify-between gap-1.5 sm:gap-3 pt-3 sm:pt-5">
        <div className="flex flex-col gap-0.5 min-w-0">
          {product.old_price ? (
            <span className="text-[10px] sm:text-xs font-medium text-slate-400 line-through leading-none">
              {toPriceFormat(product.old_price)}
            </span>
          ) : null}
          <div className="flex items-baseline gap-1 flex-wrap">
            <span className="text-base sm:text-xl font-black tracking-tight text-slate-900 leading-none">
              {toPriceFormat(product.price)}
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-slate-400 leading-none">
              / {product.unit}
            </span>
          </div>
        </div>
        {!product.is_available ? (
          <StockAlertButton
            productId={product.id}
            productName={product.name}
            className="inline-flex h-8 sm:h-10 items-center justify-center gap-1 rounded-xl border border-amber-300 bg-amber-50 px-2 sm:px-3 text-[11px] sm:text-xs font-bold text-amber-900 hover:bg-amber-100 transition shadow-xs"
          />
        ) : (
          cartControl ?? (
            <button
              className="flex size-8.5 sm:size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-700/20 transition-all hover:scale-105 hover:bg-emerald-700 active:scale-95"
              type="button"
              aria-label={`Добавить ${product.name} в корзину`}
            >
              <ShoppingCart size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          )
        )}
      </div>
    </article>
  );
};

const getProductTypeLabel = (productType: string): string => {
  return productType === "weight" ? "Весовой товар" : "Штучный товар";
};
