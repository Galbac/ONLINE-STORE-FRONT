"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  HeartOff,
  Plus,
  ShoppingCart,
  Sparkles,
  Trash2,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";
import { apiClient } from "@/shared/api";
import { useCartStore } from "@/entities/cart";
import {
  useFavoritesStore,
  type FavoriteProductResponse,
  type FavoritesResponse,
} from "@/entities/favorite";
import type { ProductShortResponse } from "@/entities/product";
import { cn, ROUTES } from "@/shared/config";
import { toPriceFormat } from "@/shared/lib/format";
import { useIsHydrated } from "@/shared/lib/hooks";
import { Container } from "@/shared/ui";

interface ProfileFavoritesViewProps {
  initialFavorites: FavoritesResponse;
}

// Fallback recommended products if network or API returns empty
const FALLBACK_RECOMMENDED_PRODUCTS: ProductShortResponse[] = [
  {
    id: 101,
    name: "Молоко пастеризованное 3.2%",
    slug: "moloko-3-2",
    price: "89.00",
    old_price: "105.00",
    unit: "шт",
    product_type: "piece",
    is_available: true,
    stock_display: "В наличии",
    category: { id: 3, name: "Молочные продукты", slug: "molochnye-produkty" },
    preview_image_url: null,
  },
  {
    id: 102,
    name: "Бананы свежие экстра",
    slug: "banany",
    price: "149.00",
    old_price: null,
    unit: "кг",
    product_type: "weight",
    is_available: true,
    stock_display: "В наличии",
    category: { id: 1, name: "Фрукты и ягоды", slug: "frukty-i-yagody" },
    preview_image_url: null,
  },
  {
    id: 103,
    name: "Хлеб ремесленный на закваске",
    slug: "khleb-remeslennyj",
    price: "65.00",
    old_price: "75.00",
    unit: "шт",
    product_type: "piece",
    is_available: true,
    stock_display: "В наличии",
    category: { id: 4, name: "Хлеб и выпечка", slug: "khleb-i-vypechka" },
    preview_image_url: null,
  },
  {
    id: 104,
    name: "Томаты розовые отборные",
    slug: "tomaty-rozovye",
    price: "249.00",
    old_price: "289.00",
    unit: "кг",
    product_type: "weight",
    is_available: true,
    stock_display: "В наличии",
    category: { id: 2, name: "Овощи", slug: "ovoshchi" },
    preview_image_url: null,
  },
];

export const ProfileFavoritesView = ({ initialFavorites }: ProfileFavoritesViewProps) => {
  const isHydrated = useIsHydrated();
  const {
    items,
    isLoading,
    isClearing,
    isAddingAllToCart,
    pendingProductId,
    fetchFavorites,
    removeFavorite,
    clearFavorites,
    addAllToCart,
    setItems,
  } = useFavoritesStore();

  const { addItem: addCartItem } = useCartStore();

  // Populate from initialFavorites on first load if store is empty
  useEffect(() => {
    if (initialFavorites?.items && initialFavorites.items.length > 0 && items.length === 0) {
      setItems(initialFavorites.items);
    }
  }, [initialFavorites, items.length, setItems]);

  // Sync favorites with API on mount
  useEffect(() => {
    void fetchFavorites();
  }, [fetchFavorites]);

  if (!isHydrated) {
    return <FavoritesSkeleton />;
  }

  const hasItems = items.length > 0;

  return (
    <main className="min-h-[75vh] bg-slate-50/50 py-6 md:py-10">
      <Container>
        {/* Хлебные крошки */}
        <nav
          aria-label="Навигация"
          className="mb-6 flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-500"
        >
          <Link
            className="transition-colors hover:text-emerald-700"
            href={ROUTES.HOME}
          >
            Главная
          </Link>
          <span>/</span>
          <Link
            className="transition-colors hover:text-emerald-700"
            href={ROUTES.PROFILE}
          >
            Профиль
          </Link>
          <span>/</span>
          <span className="font-medium text-slate-800">Избранное</span>
        </nav>

        {/* Заголовок страницы и панель действий */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
              Избранное
            </h1>
            <span
              aria-live="polite"
              role="status"
              className="inline-flex items-center rounded-xl bg-emerald-50 px-3 py-1 text-xs sm:text-sm font-extrabold text-emerald-800 border border-emerald-100"
            >
              {items.length} {getPlural(items.length, ["товар", "товара", "товаров"])}
            </span>
          </div>

          {hasItems && (
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                disabled={isAddingAllToCart || isClearing || isLoading}
                onClick={() => addAllToCart()}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-sm shadow-emerald-700/20 transition-all hover:bg-emerald-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                aria-label="Добавить все товары из избранного в корзину"
              >
                <ShoppingCart size={17} />
                <span>
                  {isAddingAllToCart ? "Добавляем..." : "Добавить всё в корзину"}
                </span>
              </button>

              <button
                type="button"
                disabled={isClearing || isAddingAllToCart || isLoading}
                onClick={() => clearFavorites()}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition-all hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                aria-label="Очистить все товары из избранного"
              >
                <Trash2 size={16} />
                <span>{isClearing ? "Очищаем..." : "Очистить"}</span>
              </button>
            </div>
          )}
        </div>

        {/* Основной контент */}
        {hasItems ? (
          <section
            aria-label="Список избранных товаров"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5"
          >
            {items.map((product) => (
              <FavoriteItemCard
                key={product.id}
                product={product}
                isPending={pendingProductId === product.id}
                onRemove={() => removeFavorite(product.id, product.name)}
                onAddToCart={() =>
                  addCartItem({
                    product_id: product.id,
                    quantity: product.quantity_step ? Number(product.quantity_step) : 1,
                    name: product.name,
                  })
                }
              />
            ))}
          </section>
        ) : (
          <div className="space-y-12">
            {/* Единственный аккуратный блок пустого состояния БЕЗ дублирования кнопок */}
            <EmptyFavoritesState />

            {/* Блок «Рекомендуем попробовать» */}
            <RecommendedSection
              onAddToCart={(product) =>
                addCartItem({
                  product_id: product.id,
                  quantity: 1,
                  name: product.name,
                })
              }
            />
          </div>
        )}
      </Container>
    </main>
  );
};

interface FavoriteItemCardProps {
  product: FavoriteProductResponse;
  isPending: boolean;
  onRemove: () => void;
  onAddToCart: () => void;
}

const FavoriteItemCard = ({
  isPending,
  onAddToCart,
  onRemove,
  product,
}: FavoriteItemCardProps) => {
  const isAvailable = product.is_available;
  const isHalal = product.is_halal;

  return (
    <article className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/30 hover:shadow-lg hover:shadow-slate-900/5">
      {/* Кнопка удаления из избранного (Heart) — строго min-h-[44px] min-w-[44px] */}
      <div className="absolute top-3 right-3 z-10">
        <button
          type="button"
          disabled={isPending}
          onClick={onRemove}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/95 text-rose-500 shadow-xs backdrop-blur-md transition-all hover:scale-110 hover:bg-rose-50 hover:text-rose-600 active:scale-90 disabled:cursor-wait disabled:opacity-50 cursor-pointer"
          aria-label={'Убрать ' + product.name + ' из избранного'}
        >
          <Heart fill="currentColor" size={19} />
        </button>
      </div>

      {/* Бейджи Халяль и Скидка */}
      <div className="absolute top-3 left-3 z-10 flex flex-col items-start gap-1.5 pointer-events-none">
        {product.discount_percent ? (
          <span className="pointer-events-auto rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 px-2 py-0.5 text-[11px] font-black text-white shadow-xs">
            -{product.discount_percent}%
          </span>
        ) : null}
        {isHalal ? (
          <span className="pointer-events-auto rounded-md bg-emerald-700/95 px-1.5 py-0.5 text-[9px] font-black tracking-wider text-white uppercase shadow-2xs">
            ХАЛЯЛЬ
          </span>
        ) : null}
      </div>

      {/* Превью товара */}
      <Link
        href={ROUTES.PRODUCT(product.slug)}
        className="mb-3 flex h-40 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-slate-50/70 to-slate-100/40 p-3"
      >
        {product.preview_image_url ? (
          <Image
            src={product.preview_image_url}
            alt={product.name}
            width={200}
            height={160}
            className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="grid size-20 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 transition-transform duration-300 group-hover:scale-110">
            <ShoppingBag size={32} />
          </span>
        )}
      </Link>

      {/* Категория и статус наличия */}
      <div className="mb-1.5 flex items-center justify-between gap-1 text-xs">
        <span className="truncate text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
          {product.category?.name ?? "Каталог"}
        </span>
        <span className="text-[11px] font-medium text-slate-500">
          {isAvailable ? "В наличии" : "Под заказ"}
        </span>
      </div>

      {/* Название */}
      <Link
        href={ROUTES.PRODUCT(product.slug)}
        className="line-clamp-2 min-h-[40px] text-sm font-bold text-slate-900 transition-colors hover:text-emerald-700 leading-snug"
      >
        {product.name}
      </Link>

      {/* Блок цены и кнопка «В корзину» */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1">
              <span
                aria-live="polite"
                className="text-xl font-extrabold tracking-tight text-slate-900"
              >
                {toPriceFormat(product.price)}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                / {product.unit}
              </span>
            </div>
            {product.old_price && (
              <span className="text-xs font-medium text-slate-400 line-through">
                {toPriceFormat(product.old_price)}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          disabled={!isAvailable || isPending}
          onClick={onAddToCart}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-xs shadow-emerald-700/20 transition-all hover:bg-emerald-700 active:scale-98 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          aria-label={'Добавить ' + product.name + ' в корзину'}
        >
          <ShoppingCart size={17} />
          <span>{isAvailable ? "В корзину" : "Нет в наличии"}</span>
        </button>
      </div>
    </article>
  );
};

const EmptyFavoritesState = () => {
  return (
    <section
      aria-label="Пустой список избранного"
      className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-xs md:p-14"
    >
      <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-3xl bg-rose-50 text-rose-500 shadow-inner ring-8 ring-rose-50/50">
        <HeartOff size={40} className="stroke-[1.8]" />
      </div>

      <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
        В избранном пока пусто
      </h2>

      <p className="mx-auto mt-3 max-w-md text-sm sm:text-base text-slate-500 leading-relaxed">
        Сохраняйте любимые товары сердечком на карточке, чтобы не терять их, следить за ценами и
        заказывать в один клик.
      </p>

      {/* Единственная четкая кнопка CTA — никакого визуального дублирования */}
      <div className="mt-8 flex justify-center">
        <Link
          href={ROUTES.CATALOG}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2.5 rounded-xl bg-emerald-600 px-7 text-sm font-bold text-white shadow-md shadow-emerald-700/20 transition-all hover:bg-emerald-700 hover:scale-[1.02] active:scale-95"
        >
          <span>Перейти в каталог</span>
          <ArrowRight size={17} />
        </Link>
      </div>
    </section>
  );
};

const RecommendedSection = ({
  onAddToCart,
}: {
  onAddToCart: (product: ProductShortResponse) => void;
}) => {
  const [recommended, setRecommended] = useState<ProductShortResponse[]>([]);
  const [, setLoading] = useState(true);
  const { toggleFavorite, isFavorite } = useFavoritesStore();

  useEffect(() => {
    let isMounted = true;
    apiClient
      .get<{ items: ProductShortResponse[] }>("/api/products/popular?limit=4")
      .then((res) => {
        if (isMounted) {
          if (res.items && Array.isArray(res.items) && res.items.length > 0) {
            setRecommended(res.items.slice(0, 4));
          } else {
            setRecommended(FALLBACK_RECOMMENDED_PRODUCTS);
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setRecommended(FALLBACK_RECOMMENDED_PRODUCTS);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const displayList = recommended.length > 0 ? recommended : FALLBACK_RECOMMENDED_PRODUCTS;

  return (
    <section aria-labelledby="recommended-heading" className="mt-12">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <Sparkles size={19} />
          </span>
          <div>
            <h3
              id="recommended-heading"
              className="text-xl font-extrabold text-slate-900 tracking-tight sm:text-2xl"
            >
              Рекомендуем попробовать
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Популярные товары, которые чаще всего заказывают покупатели
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {displayList.map((product) => {
          const favorite = isFavorite(product.id);
          return (
            <div
              key={product.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/30 hover:shadow-md"
            >
              <div className="absolute top-3 right-3 z-10">
                <button
                  type="button"
                  onClick={() => toggleFavorite(product as FavoriteProductResponse)}
                  className={cn(
                    "flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-white/95 shadow-xs backdrop-blur-md transition-all hover:scale-110 active:scale-90 cursor-pointer",
                    favorite ? "text-rose-500" : "text-slate-400 hover:text-rose-500",
                  )}
                  aria-label={
                    favorite
                      ? 'Убрать ' + product.name + ' из избранного'
                      : 'Добавить ' + product.name + ' в избранное'
                  }
                >
                  <Heart fill={favorite ? "currentColor" : "none"} size={18} />
                </button>
              </div>

              <Link
                href={ROUTES.PRODUCT(product.slug)}
                className="mb-3 flex h-36 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-b from-slate-50/70 to-slate-100/40 p-2"
              >
                {product.preview_image_url ? (
                  <Image
                    src={product.preview_image_url}
                    alt={product.name}
                    width={160}
                    height={140}
                    className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <ShoppingBag size={28} className="text-slate-300" />
                )}
              </Link>

              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                  {product.category?.name ?? "Популярное"}
                </span>
                <Link
                  href={ROUTES.PRODUCT(product.slug)}
                  className="mt-2 block line-clamp-2 min-h-[38px] text-sm font-bold text-slate-900 transition-colors hover:text-emerald-700 leading-snug"
                >
                  {product.name}
                </Link>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <div>
                  <span className="text-lg font-extrabold text-slate-900">
                    {toPriceFormat(product.price)}
                  </span>
                  <span className="text-xs text-slate-400 ml-1">/ {product.unit}</span>
                </div>

                <button
                  type="button"
                  onClick={() => onAddToCart(product)}
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition cursor-pointer"
                  aria-label={'Добавить ' + product.name + ' в корзину'}
                >
                  <Plus size={16} />
                  <span>В корзину</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

const FavoritesSkeleton = () => {
  return (
    <main className="min-h-[75vh] bg-slate-50/50 py-6 md:py-10">
      <Container>
        <div className="mb-6 h-4 w-48 animate-pulse rounded-md bg-slate-200" />
        <div className="mb-8 flex items-center justify-between">
          <div className="h-10 w-64 animate-pulse rounded-xl bg-slate-200" />
          <div className="h-11 w-44 animate-pulse rounded-xl bg-slate-200" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-xs"
            >
              <div className="mb-3 h-40 animate-pulse rounded-xl bg-slate-100" />
              <div className="mb-2 h-4 w-24 animate-pulse rounded-md bg-slate-100" />
              <div className="mb-4 h-5 w-full animate-pulse rounded-md bg-slate-100" />
              <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="h-6 w-20 animate-pulse rounded-md bg-slate-100" />
                <div className="h-11 w-28 animate-pulse rounded-xl bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      </Container>
    </main>
  );
};

const getPlural = (value: number, variants: [string, string, string]): string => {
  const absoluteValue = Math.abs(value);
  const lastDigit = absoluteValue % 10;
  const lastTwoDigits = absoluteValue % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return variants[2];
  }

  if (lastDigit === 1) {
    return variants[0];
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return variants[1];
  }

  return variants[2];
};
