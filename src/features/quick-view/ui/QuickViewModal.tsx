"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Eye, ShoppingBag, Star, X } from "lucide-react";
import { cartApi } from "@/entities/cart";
import { productApi, type ProductDetailResponse, type ProductShortResponse } from "@/entities/product";
import { CatalogCartButton, StockAlertButton } from "@/features/catalog-product-actions";
import { cn, ROUTES } from "@/shared/config";
import { CART_CHANGED_EVENT } from "@/shared/lib/cart-events";
import { toPriceFormat } from "@/shared/lib/format";
import { getStoredAccessToken } from "@/shared/ui/auth-guard";

interface QuickViewButtonProps {
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
  const [mounted, setMounted] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [productDetail, setProductDetail] = useState<ProductDetailResponse | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isInCart, setIsInCart] = useState(initialInCart);

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
      setSelectedImage(null);
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
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const activeImageUrl = selectedImage ?? product.preview_image_url;
  const allImages = productDetail?.images?.length
    ? productDetail.images
    : product.preview_image_url
      ? [{ id: 0, url: product.preview_image_url, sort_order: 0 }]
      : [];

  const categoryName = product.category?.name ?? "Каталог";
  const categoryLink = product.category?.slug
    ? ROUTES.CATEGORY(product.category.slug)
    : ROUTES.CATALOG;

  const modalContent = isOpen ? (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`quick-view-title-${product.id}`}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-3 sm:p-6 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-30 flex size-9 items-center justify-center rounded-full bg-slate-100/95 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-all hover:scale-105 active:scale-95 shadow-xs"
          aria-label="Закрыть быстрое окно"
        >
          <X size={18} />
        </button>

        {/* Left column: Image & Gallery */}
        <div className="relative flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 via-slate-50/80 to-slate-100/60 p-6 sm:p-8 md:w-1/2 border-b md:border-b-0 md:border-r border-slate-100 shrink-0">
          {/* Discount badge */}
          {product.discount_percent ? (
            <span className="absolute top-4 left-4 z-20 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 px-3 py-1 text-xs font-black text-white shadow-sm shadow-rose-500/20">
              -{product.discount_percent}%
            </span>
          ) : null}

          {/* Main Image */}
          <div className="relative flex size-52 sm:size-64 md:size-72 items-center justify-center">
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
              {allImages.map((img) => {
                const isSelected = activeImageUrl === img.url;
                return (
                  <button
                    key={img.id || img.url}
                    type="button"
                    onClick={() => setSelectedImage(img.url)}
                    className={cn(
                      "relative size-12 shrink-0 overflow-hidden rounded-xl border-2 bg-white transition-all",
                      isSelected
                        ? "border-emerald-600 ring-2 ring-emerald-600/20"
                        : "border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100",
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
          <div className="absolute bottom-4 left-4 z-20 rounded-lg bg-white/95 backdrop-blur-sm px-2.5 py-1 text-[11px] font-semibold text-slate-600 border border-slate-200/80 shadow-2xs">
            {product.product_type === "weight" ? "Весовой товар" : "Штучный товар"}
          </div>
        </div>

        {/* Right column: Info & Actions */}
        <div className="flex flex-col justify-between p-5 sm:p-7 md:w-1/2 overflow-y-auto max-h-[75vh] md:max-h-[85vh]">
          <div>
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2 pr-8">
              <Link
                href={categoryLink}
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200/50 hover:bg-emerald-100 transition"
              >
                {categoryName}
              </Link>
              <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700 border border-amber-200/40">
                <Star size={13} className="fill-amber-400 text-amber-400" />
                4.9
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
                <span
                  className={cn(
                    "size-2 rounded-full",
                    product.is_available
                      ? "bg-emerald-500 ring-4 ring-emerald-50"
                      : "bg-rose-500 ring-4 ring-rose-50",
                  )}
                />
                {product.stock_display}
              </span>
            </div>

            {/* Product Title */}
            <h2
              id={`quick-view-title-${product.id}`}
              className="mt-3 text-lg sm:text-2xl font-black text-slate-900 leading-snug tracking-tight hover:text-emerald-700 transition"
            >
              <Link href={ROUTES.PRODUCT(product.slug)} onClick={() => setIsOpen(false)}>
                {product.name}
              </Link>
            </h2>

            {/* Measurement & Step */}
            <p className="mt-1 text-xs text-slate-500">
              Единица измерения:{" "}
              <span className="font-semibold text-slate-700">{product.unit}</span>
              {product.product_type === "weight" ? " (На развес)" : " (Штучный)"}
              {product.quantity_step ? (
                <span className="text-slate-400 ml-1.5">
                  • Шаг: {product.quantity_step} {product.unit}
                </span>
              ) : null}
            </p>

            {/* Price section */}
            <div className="mt-3.5 sm:mt-4 flex flex-wrap items-baseline gap-2.5">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {toPriceFormat(product.price)}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-slate-400">/{product.unit}</span>
              {product.old_price ? (
                <span className="text-sm sm:text-base font-medium text-slate-400 line-through">
                  {toPriceFormat(product.old_price)}
                </span>
              ) : null}
              {product.discount_percent ? (
                <span className="rounded-lg bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-600 border border-rose-200/50">
                  Скидка {product.discount_percent}%
                </span>
              ) : null}
            </div>

            {/* Description or details */}
            {isLoadingDetail ? (
              <div className="mt-4 space-y-2 animate-pulse">
                <div className="h-3 w-3/4 rounded bg-slate-100" />
                <div className="h-3 w-1/2 rounded bg-slate-100" />
              </div>
            ) : productDetail?.description ? (
              <div className="mt-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Описание
                </p>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3 sm:line-clamp-4">
                  {productDetail.description}
                </p>
              </div>
            ) : null}
          </div>

          {/* Bottom Actions */}
          <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-slate-100 flex flex-col gap-3">
            {!product.is_available ? (
              <StockAlertButton productId={product.id} productName={product.name} />
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <CatalogCartButton
                    initialInCart={isInCart}
                    productId={product.id}
                    productName={product.name}
                    minQuantity={product.min_quantity}
                    quantityStep={product.quantity_step}
                    showText={true}
                    className="w-full h-11 sm:h-12 justify-center shadow-md text-sm font-bold"
                  />
                </div>
                {product.min_quantity ? (
                  <span className="text-xs text-slate-500 font-medium">
                    Мин. заказ: {product.min_quantity} {product.unit}
                  </span>
                ) : null}
              </div>
            )}

            <Link
              href={ROUTES.PRODUCT(product.slug)}
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-emerald-50 hover:border-emerald-200/80 hover:text-emerald-800 py-2.5 px-4 text-xs font-bold text-slate-700 transition active:scale-[0.99]"
            >
              <span>Перейти на страницу товара</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  ) : null;

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
            "peer flex size-7 sm:size-9 items-center justify-center rounded-full bg-white/95 text-slate-500 shadow-sm backdrop-blur-md transition-all duration-200 border border-slate-200/70 hover:border-emerald-400 hover:scale-110 hover:bg-emerald-50 hover:text-emerald-700 active:scale-95 opacity-0 pointer-events-none -translate-x-1.5 group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-x-0 focus-visible:opacity-100 focus-visible:pointer-events-auto focus-visible:translate-x-0 focus-visible:ring-2 focus-visible:ring-emerald-500",
            className,
          )}
          aria-label={`Быстрый просмотр ${product.name}`}
        >
          <Eye size={15} className="sm:w-4 sm:h-4" />
        </button>
        <span
          role="tooltip"
          className="pointer-events-none absolute left-full top-1/2 ml-2 -translate-y-1/2 rounded-lg bg-slate-900/90 px-2.5 py-1 text-[11px] font-medium text-white shadow-md backdrop-blur-xs whitespace-nowrap opacity-0 transition-all duration-150 peer-hover:opacity-100 z-30 hidden sm:block -translate-x-1 peer-hover:translate-x-0"
        >
          Быстрый просмотр
        </span>
      </div>

      {mounted ? createPortal(modalContent, document.body) : null}
    </>
  );
};
