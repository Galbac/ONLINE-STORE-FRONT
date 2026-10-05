"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { productApi, type ProductListParams, type ProductListResponse } from "@/entities/product";
import { CatalogCartButton, CatalogFavoriteButton } from "@/features/catalog-product-actions";
import { cn } from "@/shared/config";
import { ProductCard, type ProductViewMode } from "@/shared/ui";

interface CatalogProductFeedProps {
  initialProducts: ProductListResponse;
  params: ProductListParams;
  viewMode: ProductViewMode;
  cartProductIds: number[];
  favoriteProductIds: number[];
}

export const CatalogProductFeed = ({
  initialProducts,
  params,
  viewMode,
  cartProductIds,
  favoriteProductIds,
}: CatalogProductFeedProps) => {
  const [products, setProducts] = useState(initialProducts.items);
  const [page, setPage] = useState(initialProducts.page);
  const [hasMore, setHasMore] = useState(initialProducts.page < initialProducts.pages);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setLoading(true);
    setError(false);

    try {
      const response = await productApi.getList({ ...params, page: page + 1 });
      if (!mountedRef.current) return;
      setProducts((current) => {
        const ids = new Set(current.map((product) => product.id));
        return [
          ...current,
          ...response.items.filter((product) => {
            if (ids.has(product.id)) return false;
            ids.add(product.id);
            return true;
          }),
        ];
      });
      setPage(response.page);
      setHasMore(response.items.length > 0 && response.page < response.pages);
    } catch {
      if (mountedRef.current) setError(true);
    } finally {
      loadingRef.current = false;
      if (mountedRef.current) setLoading(false);
    }
  }, [hasMore, page, params]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || loading || error) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void loadMore();
      },
      { rootMargin: "0px 0px 1200px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [error, hasMore, loading, loadMore]);

  const gridClassName = cn(
    "mt-5 grid gap-3.5 sm:gap-4",
    viewMode === "grid" ? "grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" : "grid-cols-1",
  );
  const cartIds = new Set(cartProductIds);
  const favoriteIds = new Set(favoriteProductIds);

  return (
    <>
      <div className={gridClassName} aria-busy={loading}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            variant={viewMode}
            initialInCart={cartIds.has(product.id)}
            cartControl={
              <CatalogCartButton
                className="h-10 w-full font-bold"
                initialInCart={cartIds.has(product.id)}
                productId={product.id}
                productName={(product.name ?? "").trim()}
                minQuantity={product.min_quantity}
                quantityStep={product.quantity_step}
                unit={product.unit}
              />
            }
            favoriteControl={
              <CatalogFavoriteButton
                initialFavorite={favoriteIds.has(product.id)}
                productId={product.id}
                productName={(product.name ?? "").trim()}
              />
            }
          />
        ))}
      </div>
      <div
        ref={sentinelRef}
        className="mt-6 flex min-h-[80vh] flex-col items-center justify-center gap-3 [overflow-anchor:none]"
        role="status"
        aria-live="polite"
      >
        {error ? (
          <>
            <p className="text-sm text-slate-500">Не удалось загрузить следующие товары.</p>
            <button
              type="button"
              onClick={() => void loadMore()}
              className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              Повторить загрузку
            </button>
          </>
        ) : hasMore ? (
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={loading}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-wait disabled:opacity-70"
          >
            {loading ? (
              <>
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                Загружаем товары…
              </>
            ) : "Показать ещё"}
          </button>
        ) : null}
      </div>
    </>
  );
};
