"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ProductShortResponse } from "@/entities/product";
import { CatalogCartButton, CatalogFavoriteButton, StockAlertButton } from "@/features/catalog-product-actions";
import { QuickViewButton } from "@/features/quick-view";
import { ROUTES } from "@/shared/config";
import { toPriceFormat } from "@/shared/lib/format";

export interface ProductCardProps {
  product: ProductShortResponse;
  cartControl?: React.ReactNode;
  favoriteControl?: React.ReactNode;
  variant?: "grid" | "list";
  initialInCart?: boolean;
}

const FALLBACK_IMAGE = "/product-placeholder.svg";

export const ProductCard = ({
  cartControl,
  favoriteControl,
  product,
  variant = "grid",
  initialInCart = false,
}: ProductCardProps) => {
  // 1. Строгий санитайзинг строк
  const cleanName = (product.name ?? "").trim();
  const rawCategoryName = product.category?.name ?? "Каталог";
  const cleanCategoryName = rawCategoryName.trim();

  // 2. Локальный стейт ошибки изображения с автоподстановкой красивого SVG-плейсхолдера
  const rawImageUrl = (product.preview_image_url ?? "").trim();
  const [imgSrc, setImgSrc] = useState<string>(rawImageUrl || FALLBACK_IMAGE);
  const [hasError, setHasError] = useState<boolean>(!rawImageUrl);

  useEffect(() => {
    const nextUrl = (product.preview_image_url ?? "").trim();
    if (nextUrl) {
      setImgSrc(nextUrl);
      setHasError(false);
    } else {
      setImgSrc(FALLBACK_IMAGE);
      setHasError(true);
    }
  }, [product.preview_image_url]);

  const handleImageError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(FALLBACK_IMAGE);
    }
  };

  const isLowStock = product.is_available && product.stock_display?.startsWith("Осталось");
  const nameLower = cleanName.toLowerCase();
  const isPork =
    nameLower.includes("свинин") ||
    nameLower.includes("бекон") ||
    nameLower.includes("сало") ||
    nameLower.includes("шпик") ||
    nameLower.includes("pork") ||
    nameLower.includes("bacon") ||
    nameLower.includes("lard");

  const isHalal =
    !isPork &&
    (product.is_halal === true ||
      (product.is_halal === undefined &&
        (cleanCategoryName === "Мясо и птица" || product.category?.slug === "myaso-i-ptitsa") &&
        (nameLower.includes("кури") ||
          nameLower.includes("говяд") ||
          nameLower.includes("индейк") ||
          nameLower.includes("баран") ||
          nameLower.includes("цыплен"))));

  const unitDisplay = product.unit?.trim() ? `/ ${product.unit.trim()}` : "/ шт";

  if (variant === "list") {
    return (
      <article className="group relative grid gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/30 hover:shadow-xl hover:shadow-slate-900/5 sm:grid-cols-[160px_minmax(0,1fr)] lg:grid-cols-[180px_minmax(0,1fr)_auto]">
        {/* Бейджи скидок и халяль */}
        <div className="absolute top-3 left-3 z-10 flex flex-col items-start gap-1.5 pointer-events-none">
          {product.discount_percent ? (
            <span className="pointer-events-auto rounded-lg bg-gradient-to-r from-rose-500 to-pink-500 px-2 py-0.5 text-xs font-black text-white shadow-sm shadow-rose-500/30">
              -{product.discount_percent}%
            </span>
          ) : null}
          {isHalal ? (
            <span className="pointer-events-auto rounded-md bg-emerald-700/95 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-white uppercase shadow-2xs">
              ХАЛЯЛЬ
            </span>
          ) : null}
        </div>

        {/* Кнопка избранного */}
        <div className="absolute top-3 right-3 z-10 flex items-center">
          {favoriteControl ?? (
            <CatalogFavoriteButton
              initialFavorite={false}
              productId={product.id}
              productName={cleanName}
            />
          )}
        </div>

        {/* Контейнер изображения */}
        <Link
          className="relative aspect-square w-full overflow-hidden rounded-xl bg-gray-100 block"
          href={ROUTES.PRODUCT(product.slug)}
        >
          <Image
            alt={cleanName}
            className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
            fill
            sizes="(max-width: 640px) 160px, 180px"
            src={imgSrc}
            onError={handleImageError}
            loading="lazy"
          />
        </Link>

        {/* Инфо о товаре */}
        <div className="min-w-0 pr-8">
          <Link
            className="line-clamp-2 text-base font-bold text-slate-900 transition-colors group-hover:text-emerald-700"
            href={ROUTES.PRODUCT(product.slug)}
          >
            {cleanName}
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <span
                className={`size-2 rounded-full ${
                  product.is_available ? (isLowStock ? "bg-amber-500" : "bg-emerald-500") : "bg-rose-400"
                }`}
              />
              <span className={product.is_available ? (isLowStock ? "text-amber-700 font-bold" : "text-emerald-700") : "text-rose-600"}>
                {product.is_available ? (product.stock_display || "В наличии") : "Нет в наличии"}
              </span>
            </span>
            <span className="rounded-lg bg-emerald-50/80 px-2 py-0.5 font-semibold text-emerald-800">
              {cleanCategoryName}
            </span>
          </div>
        </div>

        {/* Цены и кнопка */}
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
            <span className="text-xs font-medium text-slate-400">{unitDisplay}</span>
          </div>
          {!product.is_available ? (
            <StockAlertButton productId={product.id} productName={cleanName} />
          ) : (
            cartControl ?? (
              <CatalogCartButton
                className="w-full h-10 font-bold"
                initialInCart={initialInCart}
                minQuantity={product.min_quantity}
                productId={product.id}
                productName={cleanName}
                quantityStep={product.quantity_step}
                unit={product.unit}
              />
            )
          )}
        </div>
      </article>
    );
  }

  // Основной GRID вариант карточки товара с четкой структурой
  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-950/5">
      {/* 1. Изображение с обязательным контейнером rounded-xl bg-gray-100 */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-gray-100">
        {/* Бейджи скидок и быстрого просмотра */}
        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col items-start gap-1.5 pointer-events-none">
          {product.discount_percent ? (
            <span className="pointer-events-auto rounded-lg bg-gradient-to-r from-rose-500 to-pink-500 px-2 py-0.5 text-[11px] sm:text-xs font-black text-white shadow-sm shadow-rose-500/30">
              -{product.discount_percent}%
            </span>
          ) : null}
          {isHalal ? (
            <span className="pointer-events-auto rounded-md bg-emerald-700/95 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-white uppercase shadow-2xs">
              ХАЛЯЛЬ
            </span>
          ) : null}
          <div className="hidden sm:block pointer-events-auto">
            <QuickViewButton product={product} initialInCart={initialInCart} />
          </div>
        </div>

        {/* Кнопка избранного в правом верхнем углу */}
        <div className="absolute top-2.5 right-2.5 z-10 flex items-center">
          {favoriteControl ?? (
            <CatalogFavoriteButton
              initialFavorite={false}
              productId={product.id}
              productName={cleanName}
            />
          )}
        </div>

        {/* Ссылка и картинка с fallback */}
        <Link
          className="relative block h-full w-full"
          href={ROUTES.PRODUCT(product.slug)}
          title={cleanName}
        >
          <Image
            alt={cleanName}
            className="object-contain p-2.5 transition-transform duration-300 group-hover:scale-105"
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            src={imgSrc}
            onError={handleImageError}
            loading="lazy"
          />
        </Link>
      </div>

      {/* 2. Название категории и индикатор статуса («В наличии») */}
      <div className="mt-3 flex h-5 items-center justify-between gap-1.5 text-xs">
        <span
          className="truncate max-w-[130px] sm:max-w-[160px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md text-[11px]"
          title={cleanCategoryName}
        >
          {cleanCategoryName}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 font-medium text-slate-500">
          <span
            className={`size-1.5 rounded-full shrink-0 ${
              product.is_available ? (isLowStock ? "bg-amber-500" : "bg-emerald-500") : "bg-rose-400"
            }`}
          />
          <span className={isLowStock ? "text-amber-700 font-bold text-[11px]" : "text-[11px] text-slate-600"}>
            {product.is_available ? (product.stock_display || "В наличии") : "Нет в наличии"}
          </span>
        </span>
      </div>

      {/* 3. Название товара (ограничение в 2 строки: line-clamp-2 и фиксированная мин. высота) */}
      <div className="mt-2 min-h-[2.5rem]">
        <Link
          className="line-clamp-2 text-xs sm:text-sm font-bold text-slate-900 transition-colors group-hover:text-emerald-700 leading-snug"
          href={ROUTES.PRODUCT(product.slug)}
          title={cleanName}
        >
          {cleanName}
        </Link>
      </div>

      {/* 4. Блок цен (текущая со скидкой + зачеркнутая старая) с указанием единицы измерения */}
      <div className="mt-3 flex flex-wrap items-baseline gap-1.5">
        <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 leading-none">
          {toPriceFormat(product.price)}
        </span>
        {product.old_price ? (
          <span className="text-[11px] sm:text-xs font-medium text-slate-400 line-through leading-none">
            {toPriceFormat(product.old_price)}
          </span>
        ) : null}
        <span className="text-[10px] sm:text-xs font-semibold text-slate-400 leading-none">
          {unitDisplay}
        </span>
      </div>

      {/* 5. Полноразмерная кнопка «В корзину» / «Купить» с hover/active анимацией */}
      <div className="mt-3 pt-1">
        {!product.is_available ? (
          <StockAlertButton
            className="w-full h-10 justify-center text-xs font-bold"
            productId={product.id}
            productName={cleanName}
          />
        ) : (
          cartControl ?? (
            <CatalogCartButton
              className="w-full h-10 justify-center text-xs sm:text-sm font-bold shadow-sm shadow-emerald-700/15 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              initialInCart={initialInCart}
              minQuantity={product.min_quantity}
              productId={product.id}
              productName={cleanName}
              quantityStep={product.quantity_step}
              unit={product.unit}
            />
          )
        )}
      </div>
    </article>
  );
};

export const ProductCardSkeleton = () => {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-sm animate-pulse">
      {/* Изображение скелетон */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-200/70" />

      {/* Категория и статус */}
      <div className="mt-3 flex h-5 items-center justify-between gap-2">
        <div className="h-4 w-20 rounded-md bg-slate-200/70" />
        <div className="h-4 w-14 rounded-md bg-slate-200/70" />
      </div>

      {/* Название */}
      <div className="mt-2 min-h-[2.5rem] space-y-1.5">
        <div className="h-4 w-full rounded bg-slate-200/70" />
        <div className="h-4 w-3/4 rounded bg-slate-200/70" />
      </div>

      {/* Цена */}
      <div className="mt-3 flex items-baseline gap-2">
        <div className="h-6 w-20 rounded bg-slate-200/70" />
        <div className="h-4 w-12 rounded bg-slate-200/70" />
      </div>

      {/* Кнопка */}
      <div className="mt-3 pt-1">
        <div className="h-10 w-full rounded-xl bg-slate-200/70" />
      </div>
    </div>
  );
};
