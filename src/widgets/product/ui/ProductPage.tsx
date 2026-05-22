import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search, Star } from "lucide-react";
import { cartApi, emptyCartResponse, emptyCartSummaryResponse } from "@/entities/cart";
import { emptyFavoritesResponse, favoriteApi } from "@/entities/favorite";
import {
  productApi,
  type ProductBreadcrumbResponse,
  type ProductDetailResponse,
  type ProductImageResponse,
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
    fallbackOnUnauthorized(favoriteApi.getList(), emptyFavoritesResponse),
  ]);

  const favoriteProductIds = new Set(favorites.items.map((favoriteProduct) => favoriteProduct.id));
  const cartProductIds = new Set(cart.items.map((item) => item.product_id));
  const relatedProducts = similarProducts.items;

  return (
    <>
      <Header />
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

              <div className="mt-5 flex flex-wrap items-center gap-5 text-sm">
                <span className="inline-flex items-center gap-1">
                  <Star className="fill-warning text-warning" size={18} />
                  4.8
                </span>
                <span>128 отзывов</span>
                <span className="text-text-muted">
                  Арт. {product.id.toString().padStart(6, "0")}
                </span>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <span className="text-4xl font-bold">{toPriceFormat(product.price)}</span>
                {product.old_price ? (
                  <span className="text-text-muted text-2xl line-through">
                    {toPriceFormat(product.old_price)}
                  </span>
                ) : null}
                {product.discount_percent ? (
                  <span className="bg-error rounded-md px-2.5 py-1 text-sm font-bold text-white">
                    -{product.discount_percent}%
                  </span>
                ) : null}
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

interface ProductGalleryProps {
  images: ProductImageResponse[];
  productName: string;
}

const ProductGallery = ({ images, productName }: ProductGalleryProps) => {
  const sortedImages = images.slice().sort((left, right) => left.sort_order - right.sort_order);
  const mainImage = sortedImages[0];

  return (
    <div>
      <div className="border-border relative grid min-h-[420px] place-items-center rounded-lg border bg-white p-8 shadow-[0_10px_28px_rgb(20_28_18/0.04)] lg:min-h-[620px]">
        {mainImage ? (
          <Image
            alt={productName}
            className="h-full max-h-[540px] w-full object-contain"
            height={620}
            src={mainImage.url}
            width={720}
            priority
          />
        ) : (
          <span className="text-[180px] leading-none">🍎</span>
        )}
        <button
          className="border-border absolute top-1/2 left-5 grid size-11 -translate-y-1/2 place-items-center rounded-full border bg-white shadow-[0_8px_18px_rgb(20_28_18/0.08)]"
          type="button"
          aria-label="Предыдущее изображение"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          className="border-border absolute top-1/2 right-5 grid size-11 -translate-y-1/2 place-items-center rounded-full border bg-white shadow-[0_8px_18px_rgb(20_28_18/0.08)]"
          type="button"
          aria-label="Следующее изображение"
        >
          <ChevronRight size={20} />
        </button>
        <button
          className="border-border absolute right-5 bottom-5 grid size-11 place-items-center rounded-full border bg-white shadow-[0_8px_18px_rgb(20_28_18/0.08)]"
          type="button"
          aria-label="Увеличить изображение"
        >
          <Search size={20} />
        </button>
      </div>

      <div className="mt-5 grid grid-cols-5 gap-4">
        {(sortedImages.length > 0
          ? sortedImages
          : Array.from({ length: 5 }, (_, index) => ({ id: index, url: "", sort_order: index }))
        )
          .slice(0, 5)
          .map((image, index) => (
            <button
              className="border-border data-[active=true]:border-accent-primary grid aspect-square place-items-center overflow-hidden rounded-lg border bg-white p-2"
              type="button"
              data-active={index === 0}
              key={`${image.id}-${index}`}
            >
              {image.url ? (
                <Image
                  alt={`${productName}, изображение ${index + 1}`}
                  className="h-full w-full object-contain"
                  height={100}
                  src={image.url}
                  width={100}
                />
              ) : (
                <span className="text-4xl leading-none">🍎</span>
              )}
            </button>
          ))}
      </div>
    </div>
  );
};

interface ProductUnitInfoProps {
  product: ProductDetailResponse;
}

const ProductUnitInfo = ({ product }: ProductUnitInfoProps) => {
  return (
    <div className="border-border my-5 grid grid-cols-3 rounded-lg border">
      <InfoCell label="Единица" value={product.unit} />
      <InfoCell
        label="Минимальный заказ"
        value={`${formatQuantity(product.min_quantity)} ${unitLabel(product.unit)}`}
      />
      <InfoCell
        label="Шаг"
        value={`${formatQuantity(product.quantity_step)} ${unitLabel(product.unit)}`}
      />
    </div>
  );
};

interface InfoCellProps {
  label: string;
  value: string;
}

const InfoCell = ({ label, value }: InfoCellProps) => {
  return (
    <div className="border-border min-w-0 border-r p-4 last:border-r-0">
      <p className="text-text-muted text-sm">{label}</p>
      <p className="mt-2 font-bold">{value}</p>
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
        <p className="text-text-secondary text-sm leading-7">
          {product.description ??
            "Свежий продукт с проверенным качеством, понятным происхождением и быстрой доставкой."}
        </p>
      </section>
      <section>
        <h2 className="mb-4 text-base font-bold">Характеристики</h2>
        <dl className="space-y-3 text-sm">
          <Characteristic label="Категория" value={product.category?.name ?? "Каталог"} />
          <Characteristic
            label="Тип товара"
            value={product.product_type === "weight" ? "Весовой" : "Штучный"}
          />
          <Characteristic label="Срок хранения" value="Уточняется при сборке заказа" />
          <Characteristic
            label="Остаток"
            value={`${formatQuantity(product.stock_quantity)} ${unitLabel(product.unit)}`}
          />
          <Characteristic label="Состав" value={product.name} />
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
