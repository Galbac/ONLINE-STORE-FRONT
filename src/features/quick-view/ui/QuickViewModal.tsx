"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Eye, ShoppingBag, Star, X } from "lucide-react";
import type { ProductShortResponse } from "@/entities/product";
import { CatalogCartButton, StockAlertButton } from "@/features/catalog-product-actions";
import { ROUTES } from "@/shared/config";
import { toPriceFormat } from "@/shared/lib/format";

interface QuickViewButtonProps {
  product: ProductShortResponse;
  initialInCart?: boolean;
}

export const QuickViewButton = ({ product, initialInCart = false }: QuickViewButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="absolute top-3 right-14 z-10 flex size-9 items-center justify-center rounded-full bg-white/90 text-slate-500 shadow-sm backdrop-blur-md transition-all hover:scale-110 hover:bg-emerald-50 hover:text-emerald-700 active:scale-95 opacity-0 group-hover:opacity-100 duration-200"
        aria-label={`Быстрый просмотр ${product.name}`}
        title="Быстрый просмотр"
      >
        <Eye size={17} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in-0 duration-150">
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1"
            >
              <X size={20} />
            </button>

            <div className="grid gap-6 sm:grid-cols-2">
              {/* Product Image */}
              <div className="relative flex aspect-square items-center justify-center rounded-xl bg-slate-50 p-6 overflow-hidden">
                {product.preview_image_url ? (
                  <Image
                    src={product.preview_image_url}
                    alt={product.name}
                    width={280}
                    height={280}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <ShoppingBag size={48} className="text-slate-300" />
                )}
                {product.discount_percent ? (
                  <span className="absolute top-3 left-3 rounded-lg bg-rose-500 px-2.5 py-1 text-xs font-bold text-white shadow-xs">
                    -{product.discount_percent}%
                  </span>
                ) : null}
              </div>

              {/* Product Info */}
              <div className="flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      {product.category?.name ?? "Каталог"}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-amber-500">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      4.9
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 leading-snug">
                    {product.name}
                  </h3>

                  <p className="mt-1 text-xs text-slate-400">
                    Единица измерения: <span className="font-semibold text-slate-600">{product.unit}</span> ({product.product_type === "weight" ? "На развес" : "Штучный"})
                  </p>

                  <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
                    <span
                      className={`size-2 rounded-full ${
                        product.is_available ? "bg-emerald-500" : "bg-rose-500"
                      }`}
                    />
                    <span>{product.stock_display}</span>
                  </div>

                  <div className="mt-5 flex items-baseline gap-3">
                    <span className="text-2xl font-extrabold text-slate-900">
                      {toPriceFormat(product.price)}
                    </span>
                    {product.old_price ? (
                      <span className="text-sm font-medium text-slate-400 line-through">
                        {toPriceFormat(product.old_price)}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 pt-4 border-t border-slate-100">
                  {!product.is_available ? (
                    <StockAlertButton productId={product.id} productName={product.name} />
                  ) : (
                    <div className="flex items-center gap-3">
                      <CatalogCartButton
                        initialInCart={initialInCart}
                        productId={product.id}
                        productName={product.name}
                        minQuantity={product.min_quantity}
                      />
                      <span className="text-xs text-slate-500">
                        Мин. заказ: {product.min_quantity} {product.unit}
                      </span>
                    </div>
                  )}

                  <Link
                    href={ROUTES.PRODUCT(product.slug)}
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition py-1"
                    onClick={() => setIsOpen(false)}
                  >
                    <span>Перейти на страницу товара</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
