import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
import type { ProductShortResponse } from "@/entities/product";
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
  if (variant === "list") {
    return (
      <article className="border-border bg-bg-primary hover:shadow-soft relative grid gap-4 rounded-lg border p-4 shadow-[0_10px_28px_rgb(20_28_18/0.06)] transition sm:grid-cols-[150px_minmax(0,1fr)] lg:grid-cols-[170px_minmax(0,1fr)_auto]">
        {product.discount_percent ? (
          <span className="bg-error absolute top-3 left-3 rounded-md px-2 py-1 text-xs font-bold text-white">
            -{product.discount_percent}%
          </span>
        ) : null}
        {favoriteControl ?? (
          <button
            aria-label={`Добавить ${product.name} в избранное`}
            className="text-text-muted hover:text-error absolute top-3 right-3 transition"
            type="button"
          >
            <Heart size={20} />
          </button>
        )}

        <Link
          className="bg-bg-secondary flex h-36 items-center justify-center rounded-lg sm:h-full sm:min-h-36"
          href={ROUTES.PRODUCT(product.slug)}
        >
          {product.preview_image_url ? (
            <Image
              alt={product.name}
              className="h-full w-full object-contain p-3"
              height={160}
              src={product.preview_image_url}
              width={220}
            />
          ) : (
            <span className="bg-bg-hover text-accent-primary grid size-24 place-items-center rounded-full">
              <ShoppingCart size={38} />
            </span>
          )}
        </Link>

        <div className="min-w-0 pr-8">
          <Link
            className="text-text-primary line-clamp-2 text-base font-bold"
            href={ROUTES.PRODUCT(product.slug)}
          >
            {product.name}
          </Link>
          <span className="text-text-secondary mt-1 block text-xs">{product.unit}</span>
          <div className="text-text-secondary mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs">
            <span
              className={
                product.is_available
                  ? "text-success font-semibold"
                  : "text-error font-semibold"
              }
            >
              {product.stock_display}
            </span>
            <span>{product.category?.name ?? "Каталог"}</span>
            <span>{getProductTypeLabel(product.product_type)}</span>
            {product.created_at ? <span>Добавлен {formatDate(product.created_at)}</span> : null}
          </div>
        </div>

        <div className="flex items-end justify-between gap-3 lg:min-w-48 lg:flex-col lg:items-end lg:justify-center">
          <div className="flex flex-wrap items-baseline gap-2 lg:justify-end">
            <span className="text-xl font-bold">{toPriceFormat(product.price)}</span>
            {product.old_price ? (
              <span className="text-text-muted text-sm line-through">
                {toPriceFormat(product.old_price)}
              </span>
            ) : null}
          </div>
          {cartControl ?? (
            <button
              aria-label={`Добавить ${product.name} в корзину`}
              className="bg-accent-primary hover:bg-accent-hover grid size-10 place-items-center rounded-lg text-white transition"
              type="button"
            >
              <ShoppingCart size={18} />
            </button>
          )}
        </div>
      </article>
    );
  }

  return (
    <article className="border-border bg-bg-primary hover:shadow-soft relative flex min-h-[330px] flex-col rounded-lg border p-4 shadow-[0_10px_28px_rgb(20_28_18/0.06)] transition hover:-translate-y-1">
      {product.discount_percent ? (
        <span className="bg-error absolute top-3 left-3 rounded-md px-2 py-1 text-xs font-bold text-white">
          -{product.discount_percent}%
        </span>
      ) : null}
      {favoriteControl ?? (
        <button
          className="text-text-muted hover:text-error absolute top-3 right-3 transition"
          type="button"
          aria-label={`Добавить ${product.name} в избранное`}
        >
          <Heart size={20} />
        </button>
      )}

      <Link
        className="mb-4 flex h-36 items-center justify-center"
        href={ROUTES.PRODUCT(product.slug)}
      >
        {product.preview_image_url ? (
          <Image
            alt={product.name}
            className="h-full w-full object-contain"
            height={160}
            src={product.preview_image_url}
            width={220}
          />
        ) : (
          <span className="bg-bg-hover text-accent-primary grid size-24 place-items-center rounded-full">
            <ShoppingCart size={38} />
          </span>
        )}
      </Link>

      <Link
        className="text-text-primary line-clamp-2 min-h-10 text-sm font-bold"
        href={ROUTES.PRODUCT(product.slug)}
      >
        {product.name}
      </Link>
      <span className="text-text-secondary mt-1 text-xs">{product.unit}</span>
      <div className="text-text-secondary mt-3 space-y-1 text-xs">
        <span
          className={
            product.is_available
              ? "text-success block font-semibold"
              : "text-error block font-semibold"
          }
        >
          {product.stock_display}
        </span>
        <span className="block">{product.category?.name ?? "Каталог"}</span>
        <span className="block">{getProductTypeLabel(product.product_type)}</span>
        {product.created_at ? (
          <span className="block">Добавлен {formatDate(product.created_at)}</span>
        ) : null}
      </div>

      <div className="mt-auto flex items-end justify-between gap-3 pt-4">
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold">{toPriceFormat(product.price)}</span>
          {product.old_price ? (
            <span className="text-text-muted text-sm line-through">
              {toPriceFormat(product.old_price)}
            </span>
          ) : null}
        </div>
        {cartControl ?? (
          <button
            className="bg-accent-primary hover:bg-accent-hover grid size-10 place-items-center rounded-lg text-white transition"
            type="button"
            aria-label={`Добавить ${product.name} в корзину`}
          >
            <ShoppingCart size={18} />
          </button>
        )}
      </div>
    </article>
  );
};

const getProductTypeLabel = (productType: string): string => {
  return productType === "weight" ? "Весовой товар" : "Штучный товар";
};

const formatDate = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};
