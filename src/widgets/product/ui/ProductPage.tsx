import { ProductReviews } from "@/widgets/product-reviews";
import { ProductGallery } from "./ProductGallery";
import { cookies } from "next/headers";
import Link from "next/link";
import { cartApi, emptyCartResponse, emptyCartSummaryResponse } from "@/entities/cart";
import { emptyFavoritesResponse, favoriteApi } from "@/entities/favorite";
import {
  productApi,
  type ProductBreadcrumbResponse,
  type ProductDetailResponse,
} from "@/entities/product";
import { CatalogCartButton, CatalogFavoriteButton } from "@/features/catalog-product-actions";
import { ProductPurchaseActions } from "@/features/product-purchase-actions";
import { fallbackOnUnauthorized } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import { toPriceFormat } from "@/shared/lib/format";
import { Container, ProductCard } from "@/shared/ui";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";

interface ProductPageProps {
  slug: string;
}

export const ProductPage = async ({ slug }: ProductPageProps) => {
  const accessToken = await getAccessToken();
  const productBySlug = await productApi.getBySlug(slug, {
    with_breadcrumbs: true,
    with_similar: false,
  });

  const [product, similarProducts, cartSummary, cart, favorites] = await Promise.all([
    productApi.getById(productBySlug.id, {
      with_breadcrumbs: true,
      with_similar: false,
    }),
    productApi.getSimilar(productBySlug.id, {
      limit: 6,
      in_stock: true,
    }),
    fallbackOnUnauthorized(cartApi.getSummary(), emptyCartSummaryResponse),
    fallbackOnUnauthorized(cartApi.get(), emptyCartResponse),
    fallbackOnUnauthorized(
      favoriteApi.getList({ page: 1, limit: 100 }, accessToken),
      emptyFavoritesResponse,
    ),
  ]);

  const favoriteProductIds = new Set(favorites.items.map((favoriteProduct) => favoriteProduct.id));
  const cartProductIds = new Set(cart.items.map((item) => item.product_id));
  const relatedProducts = similarProducts.items;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images.map((img) => img.url),
    description: product.description || `${product.name} со свежей доставкой на дом`,
    sku: String(product.id),
    category: product.category?.name,
    offers: {
      "@type": "Offer",
      priceCurrency: "RUB",
      price: product.price,
      availability: product.is_available
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "24",
      bestRating: "5",
      worstRating: "1",
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Главная",
        item: (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "") || ROUTES.HOME,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: product.category?.name || "Каталог",
        item: `${(process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "")}/catalog/${product.category?.slug || ""}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: `${(process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "")}/product/${product.slug}`,
      },
    ],
  };



  return (
    <>
      <Header />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <main>
        <Container className="py-6">
          <ProductBreadcrumbs breadcrumbs={product.breadcrumbs} product={product} />

          <section className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
            <ProductGallery images={product.images} productName={product.name} />
            <div>
              <p className="text-text-secondary mb-3 text-sm">
                {product.category?.name ?? "Каталог"}
              </p>
              <h1 className="text-text-primary text-4xl leading-tight font-bold">{product.name}</h1>

              <div className="text-text-muted mt-5 text-sm">
                Арт. {product.id.toString().padStart(6, "0")}
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50/70 to-teal-50/40 p-5 shadow-2xs">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none">
                    {toPriceFormat(product.price)}
                  </span>
                  {product.old_price ? (
                    <span className="text-lg text-slate-400 line-through leading-none font-medium">
                      {toPriceFormat(product.old_price)}
                    </span>
                  ) : null}
                  {product.discount_percent ? (
                    <span className="rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 px-3 py-1 text-xs font-black text-white shadow-xs">
                      -{product.discount_percent}%
                    </span>
                  ) : null}
                </div>
                <div className="rounded-xl bg-white/90 border border-emerald-200/60 px-3.5 py-1.5 text-xs font-bold text-emerald-800 shadow-2xs">
                  {toPriceFormat(product.price)} / {product.unit}
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between gap-4">
                <span className="text-success flex items-center gap-2 text-sm font-semibold">
                  <span className="bg-success size-2 rounded-full" />
                  {product.stock_display}
                </span>
                {isLowStock(product.stock_quantity) ? (
                  <span className="text-error text-sm">
                    Осталось {formatQuantity(product.stock_quantity)} {unitLabel(product.unit)}
                  </span>
                ) : null}
              </div>

              <ProductUnitInfo product={product} />

              <ProductPurchaseActions
                cartSummary={cartSummary}
                initialFavorite={favoriteProductIds.has(product.id)}
                isAvailable={product.is_available}
                minQuantity={product.min_quantity}
                productId={product.id}
                productName={product.name}
                quantityStep={product.quantity_step}
                stockQuantity={product.stock_quantity}
                unit={product.unit}
              />

              <ProductDescription product={product} />
            </div>
          </section>

          <section className="mt-14">
            <h2 className="mb-5 text-2xl font-bold">Похожие товары</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
              {relatedProducts.slice(0, 6).map((similarProduct) => (
                <ProductCard
                  key={similarProduct.id}
                  product={similarProduct}
                  cartControl={
                    <CatalogCartButton
                      initialInCart={cartProductIds.has(similarProduct.id)}
                      productId={similarProduct.id}
                      productName={similarProduct.name}
                      minQuantity={similarProduct.min_quantity}
                    />
                  }
                  favoriteControl={
                    <CatalogFavoriteButton
                      initialFavorite={favoriteProductIds.has(similarProduct.id)}
                      productId={similarProduct.id}
                      productName={similarProduct.name}
                    />
                  }
                />
              ))}
            </div>
          </section>

          <div className="mt-12">
            <ProductReviews productId={product.id} />
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
};

interface ProductBreadcrumbsProps {
  breadcrumbs?: ProductBreadcrumbResponse[] | null | undefined;
  product: ProductDetailResponse;
}

const ProductBreadcrumbs = ({ breadcrumbs, product }: ProductBreadcrumbsProps) => {
  const items =
    breadcrumbs?.length && product.category
      ? breadcrumbs
      : product.category
        ? [product.category]
        : [];

  return (
    <nav className="text-text-secondary mb-6 flex flex-wrap items-center gap-2 text-sm">
      <Link className="hover:text-accent-primary" href={ROUTES.HOME}>
        Главная
      </Link>
      <span>/</span>
      <Link className="hover:text-accent-primary" href={ROUTES.CATALOG}>
        Каталог
      </Link>
      {items.map((item) => (
        <span className="contents" key={`${item.id}-${item.slug}`}>
          <span>/</span>
          <Link className="hover:text-accent-primary" href={ROUTES.CATEGORY(item.slug)}>
            {item.name}
          </Link>
        </span>
      ))}
      <span>/</span>
      <span>{product.name}</span>
    </nav>
  );
};

interface ProductUnitInfoProps {
  product: ProductDetailResponse;
}

const ProductUnitInfo = ({ product }: ProductUnitInfoProps) => {
  return (
    <div className="my-5 grid grid-cols-3 gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5 shadow-2xs">
      <div className="min-w-0 text-center">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Единица</p>
        <p className="mt-1 text-sm font-extrabold text-slate-800">{product.unit}</p>
      </div>
      <div className="min-w-0 border-x border-slate-200/80 px-2 text-center">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Мин. заказ</p>
        <p className="mt-1 text-sm font-extrabold text-slate-800">
          {formatQuantity(product.min_quantity)} {unitLabel(product.unit)}
        </p>
      </div>
      <div className="min-w-0 text-center">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Шаг заказа</p>
        <p className="mt-1 text-sm font-extrabold text-slate-800">
          {formatQuantity(product.quantity_step)} {unitLabel(product.unit)}
        </p>
      </div>
    </div>
  );
};

interface ProductDescriptionProps {
  product: ProductDetailResponse;
}

const ProductDescription = ({ product }: ProductDescriptionProps) => {
  return (
    <div className="mt-8 space-y-7">
      <section>
        <h2 className="mb-3 text-base font-bold">Описание</h2>
        {product.description ? (
          <p className="text-text-secondary text-sm leading-7">{product.description}</p>
        ) : (
          <p className="text-text-muted text-sm">Описание товара не указано.</p>
        )}
      </section>
      <section>
        <h2 className="mb-4 text-base font-bold">Характеристики</h2>
        <dl className="space-y-3 text-sm">
          <Characteristic label="Категория" value={product.category?.name ?? "Каталог"} />
          <Characteristic
            label="Тип товара"
            value={product.product_type === "weight" ? "Весовой" : "Штучный"}
          />
          <Characteristic
            label="Остаток"
            value={`${formatQuantity(product.stock_quantity)} ${unitLabel(product.unit)}`}
          />
        </dl>
      </section>
    </div>
  );
};

interface CharacteristicProps {
  label: string;
  value: string;
}

const Characteristic = ({ label, value }: CharacteristicProps) => {
  return (
    <div className="grid grid-cols-[150px_minmax(0,1fr)] gap-4">
      <dt className="text-text-muted border-border overflow-hidden border-b border-dotted">
        {label}
      </dt>
      <dd>{value}</dd>
    </div>
  );
};

const isLowStock = (stockQuantity: string): boolean => {
  const stock = Number(stockQuantity);

  return Number.isFinite(stock) && stock > 0 && stock <= 6;
};

const getAccessToken = async (): Promise<string | undefined> => {
  const cookieStore = await cookies();

  return cookieStore.get("access_token")?.value;
};

const formatQuantity = (value: string): string => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return value;
  }

  return Number.isInteger(parsed) ? String(parsed) : String(parsed);
};

const unitLabel = (unit: string): string => {
  const [, unitName] = unit.split(" ");

  return unitName ?? unit;
};
