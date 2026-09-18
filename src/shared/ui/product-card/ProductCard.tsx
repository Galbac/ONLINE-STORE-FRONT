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
}

export const ProductCard = ({
  cartControl,
  favoriteControl,
  product,
  variant = "grid",
}: ProductCardProps) => {
  const isLowStock = product.is_available && product.stock_display.startsWith("Осталось");

  if (variant === "list") {
    return (
      <article className="group relative grid gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-slate-900/5 sm:grid-cols-[150px_minmax(0,1fr)] lg:grid-cols-[170px_minmax(0,1fr)_auto]">
        {product.discount_percent ? (
          <span className="absolute top-3 left-3 z-10 rounded-lg bg-rose-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm shadow-rose-500/30">
            -{product.discount_percent}%
          </span>
        ) : null}
        <QuickViewButton product={product} />
        {favoriteControl ?? (
          <button
            aria-label={`Добавить ${product.name} в избранное`}
            className="absolute top-3 right-3 z-10 flex size-9 items-center justify-center rounded-full bg-white/90 text-slate-400 shadow-sm backdrop-blur-md transition-all hover:scale-110 hover:bg-rose-50 hover:text-rose-500 active:scale-95"
            type="button"
          >
            <Heart size={18} />
          </button>
        )}

        <Link
          className="flex h-36 items-center justify-center overflow-hidden rounded-xl bg-slate-50/80 sm:h-full sm:min-h-36"
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
          <span className="mt-1 block text-xs font-medium text-slate-500">{product.unit}</span>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
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
            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
              {product.category?.name ?? "Каталог"}
            </span>
            <span>{getProductTypeLabel(product.product_type)}</span>
          </div>
        </div>

        <div className="flex items-end justify-between gap-3 lg:min-w-48 lg:flex-col lg:items-end lg:justify-center">
          <div className="flex flex-wrap items-baseline gap-2 lg:justify-end">
            <span className="text-xl font-extrabold text-slate-900">
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
    <article className="group relative flex min-h-[340px] flex-col rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-slate-900/5">
      {product.discount_percent ? (
        <span className="absolute top-3.5 left-3.5 z-10 rounded-lg bg-rose-500 px-2.5 py-1 text-xs font-bold text-white shadow-sm shadow-rose-500/30">
          -{product.discount_percent}%
        </span>
      ) : null}
      <QuickViewButton product={product} />
        {favoriteControl ?? (
        <button
          className="absolute top-3.5 right-3.5 z-10 flex size-9 items-center justify-center rounded-full bg-white/90 text-slate-400 shadow-sm backdrop-blur-md transition-all hover:scale-110 hover:bg-rose-50 hover:text-rose-500 active:scale-95"
          type="button"
          aria-label={`Добавить ${product.name} в избранное`}
        >
          <Heart size={18} />
        </button>
      )}

      <Link
        className="mb-3.5 flex h-40 items-center justify-center overflow-hidden rounded-xl bg-slate-50/80 p-3"
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
          <span className="font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
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
          <span className={isLowStock ? "text-amber-700 font-bold text-[11px]" : ""}>
            {product.stock_display}
          </span>
        </span>
      </div>

      <Link
        className="line-clamp-2 min-h-10 text-sm font-bold text-slate-900 transition-colors group-hover:text-emerald-700"
        href={ROUTES.PRODUCT(product.slug)}
      >
        {product.name}
      </Link>
      <span className="mt-1 text-xs font-medium text-slate-400">{product.unit}</span>

      <div className="mt-auto flex items-end justify-between gap-2 pt-4">
        <div className="flex flex-col">
          {product.old_price ? (
            <span className="text-xs font-medium text-slate-400 line-through">
              {toPriceFormat(product.old_price)}
            </span>
          ) : null}
          <span className="text-lg font-extrabold tracking-tight text-slate-900">
            {toPriceFormat(product.price)}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">
            {toPriceFormat(product.price)} / {product.unit}
          </span>
        </div>
        {!product.is_available ? (
          <StockAlertButton
            productId={product.id}
            productName={product.name}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 text-xs font-bold text-amber-900 hover:bg-amber-100 transition shadow-xs"
          />
        ) : (
          cartControl ?? (
            <button
              className="flex size-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-700/20 transition-all hover:scale-105 hover:bg-emerald-700 active:scale-95"
              type="button"
              aria-label={`Добавить ${product.name} в корзину`}
            >
              <ShoppingCart size={18} />
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
