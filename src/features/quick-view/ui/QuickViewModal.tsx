"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Eye, ShoppingBag, Star, X } from "lucide-react";
import { cartApi } from "@/entities/cart";
import {
  productApi,
  type ProductDetailResponse,
  type ProductShortResponse,
  type ProductReviewSummaryResponse,
} from "@/entities/product";
import { CatalogCartButton, StockAlertButton } from "@/features/catalog-product-actions";
import { cn, ROUTES } from "@/shared/config";
import { CART_CHANGED_EVENT } from "@/shared/lib/cart-events";
import { toPriceFormat } from "@/shared/lib/format";
import { getStoredAccessToken } from "@/shared/ui/auth-guard";

export interface QuickViewModalProps {
  product: ProductShortResponse;
  isOpen: boolean;
  onClose: () => void;
  initialInCart?: boolean;
}

export const QuickViewModal = ({
  product,
  isOpen,
  onClose,
  initialInCart = false,
}: QuickViewModalProps) => {
  const [mounted, setMounted] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<number | string | null>(null);
  const [productDetail, setProductDetail] = useState<ProductDetailResponse | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isInCart, setIsInCart] = useState(initialInCart);
  const [reviewSummary, setReviewSummary] = useState<ProductReviewSummaryResponse | null>(null);

  useEffect(() => {
    setReviewSummary(null);
    if (!isOpen) return;

    let isSubscribed = true;
    productApi
      .getReviewSummary(product.id)
      .then((summary) => {
        if (isSubscribed) setReviewSummary(summary);
      })
      .catch(() => {});

    return () => {
      isSubscribed = false;
    };
  }, [isOpen, product.id]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setIsInCart(initialInCart);
  }, [initialInCart]);

  // Sync cart status on modal open and on cart change events
  useEffect(() => {
    if (!isOpen || !getStoredAccessToken()) return;

    let isSubscribed = true;

    cartApi
      .get()
      .then((cart) => {
        if (!isSubscribed) return;
        const exists = cart.items?.some((it) => it.product_id === product.id);
        setIsInCart(Boolean(exists));
      })
      .catch(() => {});

    const handleCartChange = () => {
      if (!getStoredAccessToken()) return;
      cartApi
        .get()
        .then((cart) => {
          if (!isSubscribed) return;
          const exists = cart.items?.some((it) => it.product_id === product.id);
          setIsInCart(Boolean(exists));
        })
        .catch(() => {});
    };

    window.addEventListener(CART_CHANGED_EVENT, handleCartChange);
    return () => {
      isSubscribed = false;
      window.removeEventListener(CART_CHANGED_EVENT, handleCartChange);
    };
  }, [isOpen, product.id]);

  // Fetch full details (description, additional gallery photos) on open
  useEffect(() => {
    if (!isOpen) {
      setSelectedImageId(null);
      setProductDetail(null);
      return;
    }

    let isSubscribed = true;
    setIsLoadingDetail(true);

    productApi
      .getBySlug(product.slug, { with_breadcrumbs: false, with_similar: false })
      .then((detail) => {
        if (!isSubscribed) return;
        setProductDetail(detail);
      })
      .catch(() => {})
      .finally(() => {
        if (isSubscribed) setIsLoadingDetail(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [isOpen, product.slug]);

  // Handle body scroll lock & Escape key
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const allImages = productDetail?.images?.length
    ? productDetail.images
    : product.preview_image_url
      ? [{ id: 0, url: product.preview_image_url, sort_order: 0 }]
      : [];
  const selectedImage =
    selectedImageId === null
      ? undefined
      : allImages.find((image) => (image.id || image.url) === selectedImageId);
  const activeImageUrl = selectedImage?.url ?? product.preview_image_url;
  const initialImageIndex = allImages.findIndex((image) => image.url === product.preview_image_url);

  const categoryName = product.category?.name ?? "Каталог";
  const categoryLink = product.category?.slug
    ? ROUTES.CATEGORY(product.category.slug)
    : ROUTES.CATALOG;
  const stockQuantity = Number(productDetail?.stock_quantity);
  const hasLowStock =
    product.is_available &&
    Number.isFinite(stockQuantity) &&
    stockQuantity > 0 &&
    stockQuantity <= 6;

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`quick-view-title-${product.id}`}
      className="animate-in fade-in fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm duration-200 sm:p-6"
      onClick={onClose}
    >
      <div
        className="animate-in zoom-in-95 relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-2xl duration-200 md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-30 flex size-9 cursor-pointer items-center justify-center rounded-full bg-slate-100/95 text-slate-500 shadow-xs transition-all hover:scale-105 hover:bg-slate-200 hover:text-slate-800 active:scale-95 sm:top-4 sm:right-4"
          aria-label="Закрыть быстрое окно"
        >
          <X size={18} />
        </button>

        {/* Left column: Image & Gallery */}
        <div className="relative flex shrink-0 flex-col items-center justify-center border-b border-slate-100 bg-gradient-to-b from-slate-50 via-slate-50/80 to-slate-100/60 p-6 sm:p-8 md:w-1/2 md:border-r md:border-b-0">
          {/* Discount badge */}
          {product.discount_percent ? (
            <span className="absolute top-4 left-4 z-20 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 px-3 py-1 text-xs font-black text-white shadow-sm shadow-rose-500/20">
              -{product.discount_percent}%
            </span>
          ) : null}

          {/* Main Image */}
          <div className="relative flex size-52 items-center justify-center sm:size-64 md:size-72">
            {activeImageUrl ? (
              <Image
                src={activeImageUrl}
                alt={product.name}
                width={320}
                height={320}
                priority
                className="max-h-full max-w-full object-contain drop-shadow-sm transition-transform duration-300 hover:scale-105"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-300">
                <ShoppingBag size={56} />
                <span className="mt-2 text-xs font-medium text-slate-400">Нет фото</span>
              </div>
            )}
          </div>

          {/* Thumbnails row if multiple images exist */}
          {allImages.length > 1 ? (
            <div className="mt-4 flex max-w-full items-center gap-2 overflow-x-auto px-1 py-1">
              {allImages.map((img, index) => {
                const imageKey = img.id || img.url;
                const isSelected =
                  selectedImageId === null
                    ? index === initialImageIndex
                    : imageKey === selectedImageId;
                return (
                  <button
                    key={img.id || img.url}
                    type="button"
                    onClick={() => setSelectedImageId(imageKey)}
                    className={cn(
                      "relative size-12 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 bg-white transition-all focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none",
                      isSelected
                        ? "border-emerald-600 ring-2 ring-emerald-600/20"
                        : "border-slate-200 opacity-70 hover:border-slate-300 hover:opacity-100",
                    )}
                  >
                    <Image
                      src={img.url}
                      alt={product.name}
                      width={48}
                      height={48}
                      className="size-full object-contain p-1"
                    />
                  </button>
                );
              })}
            </div>
          ) : null}

          {/* Product Type chip */}
          <div className="absolute bottom-4 left-4 z-20 rounded-lg border border-slate-200/80 bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-slate-600 shadow-2xs backdrop-blur-sm">
            {product.product_type === "weight" ? "Весовой товар" : "Штучный товар"}
          </div>
        </div>

        {/* Right column: Info & Actions */}
        <div className="flex max-h-[75vh] flex-col justify-between overflow-y-auto p-5 sm:p-7 md:max-h-[85vh] md:w-1/2">
          <div>
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2 pr-8">
              <Link
                href={categoryLink}
                onClick={onClose}
                className="inline-flex items-center rounded-lg border border-emerald-200/50 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"
              >
                {categoryName}
              </Link>
              {reviewSummary ? (
                <>
                  {reviewSummary.total > 0 &&
                  Number.isFinite(reviewSummary.average_rating) &&
                  reviewSummary.average_rating >= 1 &&
                  reviewSummary.average_rating <= 5 ? (
                    <span
                      aria-label={`Средняя оценка ${reviewSummary.average_rating.toFixed(1)} из 5`}
                      className="inline-flex items-center gap-1 rounded-lg border border-amber-200/40 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700"
                    >
                      <Star size={13} className="fill-amber-400 text-amber-400" />
                      {reviewSummary.average_rating.toFixed(1)}
                    </span>
                  ) : null}
                  {reviewSummary.total > 0 ? (
                    <Link
                      href={`${ROUTES.PRODUCT(product.slug)}#reviews`}
                      onClick={onClose}
                      className="text-xs font-semibold text-slate-500 underline-offset-2 hover:text-emerald-700 hover:underline"
                    >
                      {reviewSummary.total} {getReviewWord(reviewSummary.total)}
                    </Link>
                  ) : null}
                  {reviewSummary.total === 0 ? (
                    <Link
                      href={`${ROUTES.PRODUCT(product.slug)}#reviews`}
                      onClick={onClose}
                      className="text-xs font-semibold text-slate-500 underline-offset-2 hover:text-emerald-700 hover:underline"
                    >
                      Пока нет отзывов
                    </Link>
                  ) : null}
                </>
              ) : null}
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
                <span
                  className={cn(
                    "size-2 rounded-full",
                    hasLowStock
                      ? "bg-rose-500 ring-4 ring-rose-50"
                      : product.is_available
                        ? "bg-emerald-500 ring-4 ring-emerald-50"
                        : "bg-rose-500 ring-4 ring-rose-50",
                  )}
                />
                {product.stock_display}
              </span>
              {product.is_available &&
              productDetail?.stock_quantity &&
              Number(productDetail.stock_quantity) > 0 ? (
                <span
                  className={cn(
                    "text-xs font-semibold",
                    hasLowStock ? "text-rose-600" : "text-emerald-700",
                  )}
                >
                  Осталось {formatStock(productDetail.stock_quantity)} {product.unit}
                </span>
              ) : null}
            </div>

            {/* Product Title */}
            <h2
              id={`quick-view-title-${product.id}`}
              className="mt-3 text-lg leading-snug font-black tracking-tight text-slate-900 transition hover:text-emerald-700 sm:text-2xl"
            >
              <Link href={ROUTES.PRODUCT(product.slug)} onClick={onClose}>
                {product.name}
              </Link>
            </h2>

            {/* Measurement & Step */}
            <p className="mt-1 text-xs text-slate-500">
              Единица измерения:{" "}
              <span className="font-semibold text-slate-700">{product.unit}</span>
              {product.product_type === "weight" ? " (На развес)" : " (Штучный)"}
              {product.quantity_step ? (
                <span className="ml-1.5 text-slate-400">
                  • Шаг: {product.quantity_step} {product.unit}
                </span>
              ) : null}
            </p>

            {/* Price section */}
            <div className="mt-3.5 flex flex-wrap items-baseline gap-2.5 sm:mt-4">
              <span className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                {toPriceFormat(product.price)}
              </span>
              <span className="text-xs font-semibold text-slate-400 sm:text-sm">
                /{product.unit}
              </span>
              {product.old_price ? (
                <span className="text-sm font-medium text-slate-400 line-through sm:text-base">
                  {toPriceFormat(product.old_price)}
                </span>
              ) : null}
              {product.discount_percent ? (
                <span className="rounded-lg border border-rose-200/50 bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-600">
                  Скидка {product.discount_percent}%
                </span>
              ) : null}
            </div>

            {/* Description or details */}
            {isLoadingDetail ? (
              <div className="mt-4 animate-pulse space-y-2">
                <div className="h-3 w-3/4 rounded bg-slate-100" />
                <div className="h-3 w-1/2 rounded bg-slate-100" />
              </div>
            ) : productDetail?.description ? (
              <div className="mt-4">
                <p className="mb-1 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                  Описание
                </p>
                <p className="line-clamp-3 text-xs leading-relaxed text-slate-600 sm:line-clamp-4 sm:text-sm">
                  {productDetail.description}
                </p>
              </div>
            ) : null}
          </div>

          {/* Bottom Actions */}
          <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:mt-6 sm:pt-5">
            {!product.is_available ? (
              <StockAlertButton productId={product.id} productName={product.name} />
            ) : (
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <CatalogCartButton
                    initialInCart={isInCart}
                    productId={product.id}
                    productName={product.name}
                    minQuantity={product.min_quantity}
                    quantityStep={product.quantity_step}
                    showText={true}
                    className="h-11 w-full justify-center text-sm font-bold shadow-md sm:h-12"
                  />
                </div>
                {product.min_quantity ? (
                  <span className="text-xs font-medium text-slate-500">
                    Мин. заказ: {product.min_quantity} {product.unit}
                  </span>
                ) : null}
              </div>
            )}

            <Link
              href={ROUTES.PRODUCT(product.slug)}
              onClick={onClose}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:border-emerald-200/80 hover:bg-emerald-50 hover:text-emerald-800 active:scale-[0.99]"
            >
              <span>Перейти на страницу товара</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export interface QuickViewButtonProps {
  product: ProductShortResponse;
  initialInCart?: boolean;
  className?: string;
}

export const QuickViewButton = ({
  product,
  initialInCart = false,
  className,
}: QuickViewButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="relative inline-flex items-center">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(true);
          }}
          className={cn(
            "peer pointer-events-none flex size-7 -translate-x-1.5 cursor-pointer items-center justify-center rounded-full border border-slate-200/70 bg-white/95 text-slate-500 opacity-0 shadow-sm backdrop-blur-md transition-all duration-200 group-hover:pointer-events-auto group-hover:translate-x-0 group-hover:opacity-100 hover:scale-110 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:pointer-events-auto focus-visible:translate-x-0 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-emerald-500 active:scale-95 sm:size-9",
            className,
          )}
          aria-label={`Быстрый просмотр ${product.name}`}
        >
          <Eye size={15} className="sm:h-4 sm:w-4" />
        </button>
        <span
          role="tooltip"
          className="pointer-events-none absolute top-1/2 left-full z-30 ml-2 hidden -translate-x-1 -translate-y-1/2 rounded-lg bg-slate-900/90 px-2.5 py-1 text-[11px] font-medium whitespace-nowrap text-white opacity-0 shadow-md backdrop-blur-xs transition-all duration-150 peer-hover:translate-x-0 peer-hover:opacity-100 sm:block"
        >
          Быстрый просмотр
        </span>
      </div>

      <QuickViewModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        product={product}
        initialInCart={initialInCart}
      />
    </>
  );
};

const getReviewWord = (count: number): string => {
  const category = new Intl.PluralRules("ru").select(count);
  if (category === "one") return "отзыв";
  if (category === "few") return "отзыва";
  return "отзывов";
};

const formatStock = (stock: string): string => {
  const quantity = Number(stock);
  return Number.isFinite(quantity)
    ? new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 3 }).format(quantity)
    : stock;
};
