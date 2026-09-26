"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Apple,
  Beef,
  Fish,
  Leaf,
  Milk,
  ShoppingBag,
  UtensilsCrossed,
  Wheat,
} from "lucide-react";
import type { ProductShortResponse } from "@/entities/product";
import { CatalogCartButton, CatalogFavoriteButton, StockAlertButton } from "@/features/catalog-product-actions";
import { QuickViewButton } from "@/features/quick-view";
import { ROUTES } from "@/shared/config";
import { toPriceFormat } from "@/shared/lib/format";

export interface ProductCardProps {
  product: ProductShortResponse;
  cartControl?: React.ReactNode | undefined;
  favoriteControl?: React.ReactNode | undefined;
  variant?: "grid" | "list" | undefined;
  initialInCart?: boolean | undefined;
}

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

  // 2. Определение мета-данных категории для умных заглушек
  const categoryMeta = getCategoryFallbackMeta(cleanCategoryName, cleanName);
  const FallbackIcon = categoryMeta.icon;

  // 3. Локальный стейт ошибки изображения
  const rawImageUrl = (product.preview_image_url ?? "").trim();
  const [imgSrc, setImgSrc] = useState<string | null>(rawImageUrl || null);
  const [hasError, setHasError] = useState<boolean>(!rawImageUrl);

  useEffect(() => {
    const nextUrl = (product.preview_image_url ?? "").trim();
    if (nextUrl) {
      setImgSrc(nextUrl);
      setHasError(false);
    } else {
      setImgSrc(null);
      setHasError(true);
    }
  }, [product.preview_image_url]);

  const handleImageError = () => {
    setHasError(true);
    setImgSrc(null);
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

  // Список (вариант list)
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

        {/* Кнопка избранного всегда поверх */}
        <div className="absolute top-3 right-3 z-10 flex items-center">
          {favoriteControl ?? (
            <CatalogFavoriteButton
              initialFavorite={false}
              productId={product.id}
              productName={cleanName}
            />
          )}
        </div>

        {/* Контейнер изображения с фиксированной геометрией */}
        <Link
          className="relative aspect-square w-full overflow-hidden rounded-xl bg-gray-50 block border border-slate-100"
          href={ROUTES.PRODUCT(product.slug)}
        >
          {!hasError && imgSrc ? (
            <Image
              alt={cleanName}
              className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
              fill
              sizes="(max-width: 640px) 160px, 180px"
              src={imgSrc}
              onError={handleImageError}
              loading="lazy"
            />
          ) : (
            <div className={`flex h-full w-full flex-col items-center justify-center p-3 text-center ${categoryMeta.bgClass}`}>
              <span className={`grid size-12 place-items-center rounded-2xl ${categoryMeta.badgeClass} shadow-2xs transition-transform duration-300 group-hover:scale-110`}>
                <FallbackIcon size={24} />
              </span>
              <span className="mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {categoryMeta.label}
              </span>
            </div>
          )}
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

  // Основной вариант GRID
  return (
    <article className="group relative flex h-full flex-col rounded-2xl bg-white border border-gray-100 p-3 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
      {/* 1. Контейнер картинки: aspect-square w-full rounded-xl overflow-hidden bg-gray-50 relative */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-gray-50 border border-slate-100/80">
        {/* Бейджи скидок и халяль слева вверху (top-2 left-2) */}
        <div className="absolute top-2 left-2 z-10 flex flex-col items-start gap-1 pointer-events-none">
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
        </div>

        {/* Кнопка «В избранное» (Heart) справа вверху (top-2 right-2) всегда на месте */}
        <div className="absolute top-2 right-2 z-10 flex items-center">
          {favoriteControl ?? (
            <CatalogFavoriteButton
              initialFavorite={false}
              productId={product.id}
              productName={cleanName}
            />
          )}
        </div>

        {/* Ссылка на товар и фото (или категорийный fallback) */}
        <Link
          className="relative block h-full w-full"
          href={ROUTES.PRODUCT(product.slug)}
          title={cleanName}
        >
          {!hasError && imgSrc ? (
            <Image
              alt={cleanName}
              className="object-contain p-2.5 transition-transform duration-300 group-hover:scale-105"
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              src={imgSrc}
              onError={handleImageError}
              loading="lazy"
            />
          ) : (
            <div className={`flex h-full w-full flex-col items-center justify-center p-3 text-center ${categoryMeta.bgClass}`}>
              <span className={`grid size-14 place-items-center rounded-2xl ${categoryMeta.badgeClass} shadow-2xs transition-transform duration-300 group-hover:scale-110`}>
                <FallbackIcon size={28} />
              </span>
              <span className="mt-2.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                {categoryMeta.label}
              </span>
            </div>
          )}
        </Link>

        {/* Кнопка «Быстрый просмотр» по центру внизу фото (плавно только по ховеру десктопа) */}
        <div className="absolute inset-x-2 bottom-2 z-10 hidden sm:flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
          <QuickViewButton product={product} initialInCart={initialInCart} />
        </div>
      </div>

      {/* 2. Категория и индикатор статуса («В наличии») */}
      <div className="mt-3 flex h-5 items-center justify-between gap-1.5 text-xs">
        <span
          className="truncate max-w-[130px] sm:max-w-[160px] font-medium text-slate-400 text-[11px]"
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

      {/* 3. Название товара (ограничение в 2 строки: line-clamp-2 h-10 min-h-[2.5rem]) */}
      <div className="mt-1.5 h-10 min-h-[2.5rem]">
        <Link
          className="line-clamp-2 text-xs sm:text-sm font-bold text-slate-900 transition-colors group-hover:text-emerald-700 leading-snug"
          href={ROUTES.PRODUCT(product.slug)}
          title={cleanName}
        >
          {cleanName}
        </Link>
      </div>

      {/* 4. Блок цен (актуальная крупно + старая зачеркнутая рядом/над ней + единица измерения) */}
      <div className="mt-2.5 flex flex-wrap items-baseline gap-1.5">
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

      {/* 5. Кнопка «В корзину», на десктопе при наличии превращающаяся в степпер [- 1 +] */}
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
    <div className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-3 shadow-sm animate-pulse">
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-slate-200/70" />
      <div className="mt-3 flex h-5 items-center justify-between gap-2">
        <div className="h-4 w-20 rounded bg-slate-200/70" />
        <div className="h-4 w-12 rounded bg-slate-200/70" />
      </div>
      <div className="mt-1.5 h-10 space-y-1.5">
        <div className="h-4 w-full rounded bg-slate-200/70" />
        <div className="h-4 w-3/4 rounded bg-slate-200/70" />
      </div>
      <div className="mt-2.5 flex items-baseline gap-2">
        <div className="h-6 w-20 rounded bg-slate-200/70" />
        <div className="h-4 w-12 rounded bg-slate-200/70" />
      </div>
      <div className="mt-3 pt-1">
        <div className="h-10 w-full rounded-xl bg-slate-200/70" />
      </div>
    </div>
  );
};

interface CategoryFallbackMeta {
  icon: typeof ShoppingBag;
  bgClass: string;
  badgeClass: string;
  label: string;
}

function getCategoryFallbackMeta(categoryName: string, productName: string): CategoryFallbackMeta {
  const text = `${categoryName} ${productName}`.toLowerCase();

  if (text.includes("рыб") || text.includes("сельдь") || text.includes("скумбр") || text.includes("мидии") || text.includes("морепродукт")) {
    return {
      icon: Fish,
      bgClass: "bg-gradient-to-b from-cyan-50/70 to-cyan-100/40",
      badgeClass: "bg-cyan-100 text-cyan-700",
      label: "Рыба и морепродукты",
    };
  }

  if (text.includes("мясо") || text.includes("фарш") || text.includes("говяд") || text.includes("куриц") || text.includes("индейк") || text.includes("птиц") || text.includes("баран")) {
    return {
      icon: Beef,
      bgClass: "bg-gradient-to-b from-rose-50/70 to-rose-100/40",
      badgeClass: "bg-rose-100 text-rose-700",
      label: "Мясная лавка",
    };
  }

  if (text.includes("овощ") || text.includes("томат") || text.includes("огурц") || text.includes("зелен") || text.includes("салат")) {
    return {
      icon: Leaf,
      bgClass: "bg-gradient-to-b from-emerald-50/70 to-emerald-100/40",
      badgeClass: "bg-emerald-100 text-emerald-700",
      label: "Свежие овощи",
    };
  }

  if (text.includes("фрукт") || text.includes("ягод") || text.includes("яблок") || text.includes("банан") || text.includes("апельсин")) {
    return {
      icon: Apple,
      bgClass: "bg-gradient-to-b from-amber-50/70 to-amber-100/40",
      badgeClass: "bg-amber-100 text-amber-700",
      label: "Фрукты и ягоды",
    };
  }

  if (text.includes("молок") || text.includes("сыр") || text.includes("творог") || text.includes("йогурт") || text.includes("масло")) {
    return {
      icon: Milk,
      bgClass: "bg-gradient-to-b from-blue-50/70 to-blue-100/40",
      badgeClass: "bg-blue-100 text-blue-700",
      label: "Молочные продукты",
    };
  }

  if (text.includes("круп") || text.includes("рис") || text.includes("хлеб") || text.includes("макарон") || text.includes("бакалея")) {
    return {
      icon: Wheat,
      bgClass: "bg-gradient-to-b from-orange-50/70 to-orange-100/40",
      badgeClass: "bg-orange-100 text-orange-700",
      label: "Бакалея и крупы",
    };
  }

  return {
    icon: UtensilsCrossed,
    bgClass: "bg-gradient-to-b from-slate-50/70 to-slate-100/40",
    badgeClass: "bg-emerald-50 text-emerald-600",
    label: "Победа",
  };
}
