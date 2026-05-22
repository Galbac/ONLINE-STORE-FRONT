"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Search, ShoppingCart } from "lucide-react";
import { cartApi } from "@/entities/cart";
import {
  favoriteApi,
  type FavoriteProductResponse,
  type FavoritesResponse,
} from "@/entities/favorite";
import { cn, ROUTES } from "@/shared/config";
import { toPriceFormat } from "@/shared/lib/format";
import { Button, Container } from "@/shared/ui";

interface ProfileFavoritesViewProps {
  initialFavorites: FavoritesResponse;
}

const productEmojiByName: Record<string, string> = {
  "Авокадо Хасс": "🥑",
  Бананы: "🍌",
  "Гель для стирки Persil": "🧴",
  "Кофе Nescafe Gold": "☕",
  "Молоко Простоквашино 2,5%": "🥛",
  "Огурцы среднеплодные": "🥒",
  "Сыр Российский": "🧀",
  "Томаты сливовидные": "🍅",
  "Филе куриное": "🥩",
  "Хлеб Бородинский": "🍞",
  "Хлопья овсяные": "🥣",
  "Шоколад Alpen Gold": "🍫",
};

export const ProfileFavoritesView = ({ initialFavorites }: ProfileFavoritesViewProps) => {
  const [products, setProducts] = useState<FavoriteProductResponse[]>(initialFavorites.items);
  const [cartProductIds, setCartProductIds] = useState<Set<number>>(() => new Set());
  const [pendingProductId, setPendingProductId] = useState<number | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const accessToken = getAccessToken();

    if (!accessToken) {
      return;
    }

    let isMounted = true;

    const loadFavorites = async (): Promise<void> => {
      try {
        const response = await favoriteApi.getList({ page: 1, limit: 100 }, accessToken);

        if (isMounted) {
          setProducts(response.items);
        }
      } catch {
        if (isMounted) {
          setErrorMessage("Не удалось обновить список избранного.");
        }
      }
    };

    void loadFavorites();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddToCart = (product: FavoriteProductResponse): void => {
    startTransition(async () => {
      try {
        setPendingProductId(product.id);
        setErrorMessage(null);
        await cartApi.addItem({
          product_id: product.id,
          quantity: 1,
        });
        setCartProductIds((currentIds) => new Set(currentIds).add(product.id));
        setMessage(`${product.name} добавлен в корзину.`);
      } catch {
        setMessage(null);
        setErrorMessage("Не удалось добавить товар в корзину.");
      } finally {
        setPendingProductId(null);
      }
    });
  };

  const handleRemoveFavorite = (product: FavoriteProductResponse): void => {
    const accessToken = getAccessToken();

    startTransition(async () => {
      try {
        setPendingProductId(product.id);
        setErrorMessage(null);
        const response = await favoriteApi.remove(product.id, accessToken);

        setProducts((currentProducts) =>
          currentProducts.filter((currentProduct) => currentProduct.id !== response.product_id),
        );
        setMessage(`${product.name} удален из избранного.`);
      } catch {
        setMessage(null);
        setErrorMessage("Не удалось удалить товар из избранного.");
      } finally {
        setPendingProductId(null);
      }
    });
  };

  const handleClearFavorites = (): void => {
    const accessToken = getAccessToken();
    const currentProducts = products;

    startTransition(async () => {
      try {
        setIsClearing(true);
        setErrorMessage(null);
        await Promise.all(
          currentProducts.map((product) => favoriteApi.remove(product.id, accessToken)),
        );
        setProducts([]);
        setMessage("Избранное очищено.");
      } catch {
        setMessage(null);
        setErrorMessage("Не удалось очистить избранное полностью.");
      } finally {
        setIsClearing(false);
      }
    });
  };

  return (
    <main className="bg-bg-primary min-h-[70vh]">
      <Container className="py-6 md:py-8">
        <nav className="text-text-secondary mb-8 flex flex-wrap items-center gap-2 text-sm">
          <Link className="hover:text-accent-primary" href={ROUTES.HOME}>
            Главная
          </Link>
          <span>/</span>
          <Link className="hover:text-accent-primary" href={ROUTES.PROFILE}>
            Профиль
          </Link>
          <span>/</span>
          <span>Избранное</span>
        </nav>

        <section className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-text-primary text-4xl font-bold md:text-5xl">Избранное</h1>
              <span className="bg-bg-hover text-accent-primary rounded-md px-3 py-1 text-sm font-semibold">
                {products.length} {getPlural(products.length, ["товар", "товара", "товаров"])}
              </span>
            </div>
            <p className="text-text-secondary mt-4">Товары, которые вы добавили в избранное</p>
          </div>

          {products.length > 0 ? (
            <Button
              className="w-full gap-2 bg-white sm:w-auto"
              disabled={isPending || isClearing}
              variant="secondary"
              onClick={handleClearFavorites}
            >
              <Heart size={20} />
              {isClearing ? "Очищаем..." : "Очистить избранное"}
            </Button>
          ) : null}
        </section>

        {errorMessage ? (
          <StatusPanel text={errorMessage} tone="error" />
        ) : message ? (
          <StatusPanel text={message} tone="success" />
        ) : null}

        {products.length > 0 ? (
          <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
            {products.map((product) => (
              <FavoriteProductCard
                isInCart={cartProductIds.has(product.id)}
                isPending={pendingProductId === product.id}
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                onRemoveFavorite={handleRemoveFavorite}
              />
            ))}
          </section>
        ) : (
          <EmptyFavorites />
        )}

        <section className="border-border mt-7 flex flex-col gap-4 rounded-lg border bg-white p-5 shadow-[0_10px_28px_rgb(20_28_18/0.04)] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-4">
            <span className="bg-accent-primary text-accent-contrast grid size-12 shrink-0 place-items-center rounded-full">
              <Heart fill="currentColor" size={24} />
            </span>
            <div>
              <p className="text-text-primary font-bold">Не нашли нужный товар?</p>
              <p className="text-text-secondary mt-2 text-sm leading-6">
                Вы можете найти его в каталоге и добавить в избранное.
              </p>
            </div>
          </div>
          <Link
            className="text-accent-primary hover:text-accent-hover inline-flex h-12 items-center justify-center rounded-lg px-5 text-sm font-bold transition"
            href={ROUTES.CATALOG}
          >
            Перейти в каталог
          </Link>
        </section>
      </Container>
    </main>
  );
};

interface FavoriteProductCardProps {
  isInCart: boolean;
  isPending: boolean;
  product: FavoriteProductResponse;
  onAddToCart: (product: FavoriteProductResponse) => void;
  onRemoveFavorite: (product: FavoriteProductResponse) => void;
}

const FavoriteProductCard = ({
  isInCart,
  isPending,
  onAddToCart,
  onRemoveFavorite,
  product,
}: FavoriteProductCardProps) => {
  const emoji = productEmojiByName[product.name] ?? "🥬";

  return (
    <article className="border-border relative flex min-h-[360px] flex-col rounded-lg border bg-white p-5 shadow-[0_12px_34px_rgb(20_28_18/0.05)] transition hover:-translate-y-1 hover:shadow-[0_16px_42px_rgb(20_28_18/0.08)]">
      <button
        className="text-error absolute top-5 right-5 transition hover:scale-110 disabled:cursor-wait disabled:opacity-60"
        type="button"
        disabled={isPending}
        onClick={() => onRemoveFavorite(product)}
        aria-label={`Убрать ${product.name} из избранного`}
      >
        <Heart fill="currentColor" size={22} />
      </button>

      <Link
        className="mb-5 flex h-40 items-center justify-center"
        href={ROUTES.PRODUCT(product.slug)}
      >
        {product.preview_image_url ? (
          <Image
            alt={product.name}
            className="h-full w-full object-contain"
            height={180}
            src={product.preview_image_url}
            width={240}
          />
        ) : (
          <span className="text-7xl leading-none">{emoji}</span>
        )}
      </Link>

      <Link
        className="text-text-primary hover:text-accent-primary line-clamp-2 min-h-10 text-base font-bold"
        href={ROUTES.PRODUCT(product.slug)}
      >
        {product.name}
      </Link>
      <span className="text-text-secondary mt-2 text-sm">{product.unit}</span>

      <div className="mt-auto pt-4">
        <div className="mb-4 flex items-baseline gap-2">
          <span className="text-text-primary text-2xl font-bold">
            {toPriceFormat(product.price)}
          </span>
          {product.old_price ? (
            <span className="text-text-muted text-sm line-through">
              {toPriceFormat(product.old_price)}
            </span>
          ) : null}
        </div>
        <button
          className={cn(
            "border-accent-primary text-accent-primary hover:bg-bg-hover inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border bg-white px-4 text-sm font-bold transition",
            isInCart && "bg-bg-hover",
            (!product.is_available || isPending) && "cursor-wait opacity-70",
          )}
          type="button"
          disabled={!product.is_available || isPending}
          onClick={() => onAddToCart(product)}
          aria-label={`Добавить ${product.name} в корзину`}
        >
          <ShoppingCart size={18} />
          {isInCart ? "В корзине" : isPending ? "Добавляем..." : "В корзину"}
        </button>
      </div>
    </article>
  );
};

const EmptyFavorites = () => {
  return (
    <section className="border-border rounded-lg border bg-white p-8 text-center shadow-[0_12px_34px_rgb(20_28_18/0.05)]">
      <span className="bg-bg-hover text-accent-primary mx-auto grid size-16 place-items-center rounded-full">
        <Search size={32} />
      </span>
      <h2 className="text-text-primary mt-5 text-2xl font-bold">В избранном пока пусто</h2>
      <p className="text-text-secondary mx-auto mt-3 max-w-xl leading-7">
        Добавляйте товары из каталога, чтобы быстро возвращаться к ним перед заказом.
      </p>
      <Link
        className="bg-accent-primary text-accent-contrast hover:bg-accent-hover mt-7 inline-flex h-12 items-center justify-center rounded-lg px-5 text-sm font-bold transition"
        href={ROUTES.CATALOG}
      >
        Перейти в каталог
      </Link>
    </section>
  );
};

interface StatusPanelProps {
  text: string;
  tone: "error" | "success";
}

const StatusPanel = ({ text, tone }: StatusPanelProps) => {
  return (
    <div
      className={cn(
        "mb-5 rounded-lg border px-5 py-4 text-sm font-bold",
        tone === "error" && "text-error border-red-100 bg-red-50",
        tone === "success" && "bg-bg-hover text-accent-primary border-green-100",
      )}
    >
      {text}
    </div>
  );
};

const getAccessToken = (): string | null => {
  return (
    window.localStorage.getItem("access_token") ?? window.sessionStorage.getItem("access_token")
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
