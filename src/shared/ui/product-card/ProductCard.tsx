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
}

export const ProductCard = ({ cartControl, favoriteControl, product }: ProductCardProps) => {
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
      <span className="text-success mt-3 text-xs font-semibold">{product.stock_display}</span>

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
