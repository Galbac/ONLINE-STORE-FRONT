import { ProductReviews } from "@/widgets/product-reviews";
import { ProductGallery } from "./ProductGallery";
import { ProductArticleCopy } from "./ProductArticleCopy";
import { KizlyarDeliveryZonesModal } from "./KizlyarDeliveryZonesModal";
import { cookies } from "next/headers";
import Link from "next/link";
import { cartApi, emptyCartResponse } from "@/entities/cart";
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
import { Container, ProductCard, BackButton } from "@/shared/ui";
import { Footer } from "@/widgets/footer";
import { MapPin, RotateCcw, ShieldCheck, Sparkles, Store, ThermometerSnowflake, Truck } from "lucide-react";
import { Header } from "@/widgets/header";

interface ProductPageProps {
  slug: string;
}

export const ProductPage = async ({ slug }: ProductPageProps) => {
  const accessToken = await getAccessToken();
  const product = await productApi.getBySlug(slug, {
    with_breadcrumbs: true,
    with_similar: false,
  });

  const [similarProducts, cart, favorites] = await Promise.all([
    productApi.getSimilar(product.id, {
      limit: 6,
      in_stock: true,
    }),
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
        id="product-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        id="breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <main>
        <Container className="py-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <BackButton fallbackHref={product.category?.slug ? `/catalog/${product.category.slug}` : ROUTES.CATALOG} />
            <ProductBreadcrumbs breadcrumbs={product.breadcrumbs} product={product} />
          </div>

          <section className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
            <ProductGallery images={product.images} productName={product.name} />
            <div>
              <p className="text-text-secondary mb-3 text-sm">
                {product.category?.name ?? "Каталог"}
              </p>
              <h1 className="text-text-primary text-4xl leading-tight font-bold">{product.name}</h1>

              <div className="mt-4 flex items-center gap-2">
                <ProductArticleCopy
                  article={product.article || product.id.toString().padStart(6, "0")}
                />
              </div>

              <div className="mt-6 flex items-center justify-between gap-4">
                <span className="text-success flex items-center gap-2 text-sm font-semibold">
                  <span className="bg-success size-2 rounded-full" />
                  {product.stock_display}
                </span>
                {isLowStock(product.stock_quantity) ? (
                  <span className="text-error text-sm font-semibold">
                    Осталось {formatQuantity(product.stock_quantity)} {unitLabel(product.unit)}
                  </span>
                ) : null}
              </div>

              <ProductUnitInfo product={product} />

              {/* Halal Certified Badge for Meat */}
              {product.category?.slug === "myaso-i-ptitsa" ? (
                <div className="my-3 flex items-center gap-3 rounded-2xl border border-emerald-300/80 bg-emerald-50/80 p-3.5 shadow-2xs">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-white font-black text-xs shadow-xs tracking-wider">
                    حلال
                  </span>
                  <div className="text-xs">
                    <p className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                      Сертифицировано Халяль
                      <span className="rounded-md bg-emerald-700 px-1.5 py-0.2 text-[9px] font-black text-white">100%</span>
                    </p>
                    <p className="text-emerald-800/80 text-[11px] mt-0.5 leading-relaxed">
                      Строгий контроль халяльного убоя и фермерского происхождения (Республика Дагестан).
                    </p>
                  </div>
                </div>
              ) : null}

              {/* Freshness & Trust Guarantee */}
              <div className="my-4 flex items-center gap-3.5 rounded-2xl border border-emerald-200/60 bg-gradient-to-r from-emerald-50/70 to-teal-50/40 p-4 shadow-2xs">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                  <ShieldCheck size={20} />
                </span>
                <div className="text-xs">
                  <p className="font-bold text-slate-900">Гарантия 100% свежести</p>
                  <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">
                    Отбираем вручную каждый продукт перед сборкой. Доставим в термосумках с соблюдением температурного режима.
                  </p>
                </div>
              </div>

              <ProductPurchaseActions
                                discountPercent={product.discount_percent}
                initialFavorite={favoriteProductIds.has(product.id)}
                isAvailable={product.is_available}
                minQuantity={product.min_quantity}
                oldPrice={product.old_price}
                price={product.price}
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
                  initialInCart={cartProductIds.has(similarProduct.id)}
                  cartControl={
                    <CatalogCartButton
                      initialInCart={cartProductIds.has(similarProduct.id)}
                      productId={similarProduct.id}
                      productName={similarProduct.name}
                      minQuantity={similarProduct.min_quantity}
                      quantityStep={similarProduct.quantity_step}
                      unit={similarProduct.unit}
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
      {/* Nutrition & Storage */}
      {(() => {
        const nutrition = getProductNutrition(product.category?.slug, product.slug);
        return (
          <section className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4.5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">Пищевая ценность (на 100 г)</h3>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                <Sparkles size={12} /> {nutrition.badge}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="rounded-xl bg-white border border-slate-200/60 p-2.5 shadow-2xs">
                <span className="block text-[11px] font-medium text-slate-400">Калории</span>
                <span className="block text-xs sm:text-sm font-black text-slate-900 mt-0.5">{nutrition.calories}</span>
              </div>
              <div className="rounded-xl bg-white border border-slate-200/60 p-2.5 shadow-2xs">
                <span className="block text-[11px] font-medium text-slate-400">Белки</span>
                <span className="block text-xs sm:text-sm font-black text-slate-900 mt-0.5">{nutrition.proteins}</span>
              </div>
              <div className="rounded-xl bg-white border border-slate-200/60 p-2.5 shadow-2xs">
                <span className="block text-[11px] font-medium text-slate-400">Жиры</span>
                <span className="block text-xs sm:text-sm font-black text-slate-900 mt-0.5">{nutrition.fats}</span>
              </div>
              <div className="rounded-xl bg-white border border-slate-200/60 p-2.5 shadow-2xs">
                <span className="block text-[11px] font-medium text-slate-400">Углеводы</span>
                <span className="block text-xs sm:text-sm font-black text-slate-900 mt-0.5">{nutrition.carbs}</span>
              </div>
            </div>
            <div className="mt-3.5 pt-3 border-t border-slate-200/60 flex items-center gap-2 text-xs text-slate-500">
              <ThermometerSnowflake size={14} className="text-cyan-600 shrink-0" />
              <span>{nutrition.storage}</span>
            </div>
          </section>
        );
      })()}

      <section>
        <h2 className="mb-4 text-base font-bold">Характеристики</h2>
        <dl className="space-y-3 text-sm">
          <Characteristic label="Категория" value={product.category?.name ?? "Каталог"} />
          <Characteristic
            label="Тип товара"
            value={product.product_type === "weight" ? "Весовой (на развес)" : "Штучный (фасованный)"}
          />
          <Characteristic
            label="Производитель"
            value={
              product.category?.slug === "myaso-i-ptitsa"
                ? "Фермерские хозяйства Дагестана (Халяль)"
                : "Россия, г. Кизляр"
            }
          />
          <Characteristic
            label="Срок годности"
            value={
              product.category?.slug === "myaso-i-ptitsa"
                ? "48 часов при t 0°C..+4°C"
                : "Свежая поставка (см. на упаковке)"
            }
          />
          <Characteristic
            label="Остаток на складе"
            value={`${formatQuantity(product.stock_quantity)} ${unitLabel(product.unit)}`}
          />
        </dl>
      </section>

      {/* Delivery in City Widget */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-3.5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <MapPin size={18} className="text-emerald-600 shrink-0" />
            <span>Доставка в г. Кизляр</span>
          </div>
          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-full">
            от 45 минут
          </span>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-start gap-3">
            <Truck size={17} className="text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-800">Быстрая курьерская доставка</p>
              <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">
                Сегодня, ближайший интервал 14:00 – 16:00. Бесплатно при заказе от 1 500 ₽.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Store size={17} className="text-slate-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-800">Самовывоз из супермаркета</p>
              <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">
                ул. Ленина, 14. Готов к выдаче через 15 минут после оформления, бесплатно.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <RotateCcw size={17} className="text-slate-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-800">Гарантия 100% свежести и возврата</p>
              <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">
                Если вас не устроит качество или свежесть продуктов — вернем деньги или заменим в течение 24 часов.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-1 border-t border-slate-100 flex items-center justify-between">
          <KizlyarDeliveryZonesModal />
        </div>
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

const unitLabel = (unit?: string | null): string => {
  if (!unit) return "";
  const [, unitName] = unit.split(" ");

  return unitName ?? unit;
};

const getProductNutrition = (catSlug?: string | null, prodSlug?: string) => {
  const cat = (catSlug ?? "").toLowerCase();
  const slug = (prodSlug ?? "").toLowerCase();

  if (cat.includes("myaso") || cat.includes("мясо") || slug.includes("farsh") || slug.includes("steik") || slug.includes("file") || slug.includes("kurin") || slug.includes("bekon") || slug.includes("sosiski")) {
    return {
      badge: "🥩 Натуральное мясо",
      calories: "~254 ккал",
      proteins: "18.0 г",
      fats: "20.0 г",
      carbs: "0.0 г",
      storage: "Хранить при температуре от 0°C до +4°C не более 48 часов",
    };
  }

  if (cat.includes("ryba") || cat.includes("рыба")) {
    return {
      badge: "🐟 Дикий вылов / Аквакультура",
      calories: "~142 ккал",
      proteins: "20.5 г",
      fats: "6.8 г",
      carbs: "0.0 г",
      storage: "Хранить при температуре от 0°C до +2°C на льду",
    };
  }

  if (cat.includes("molochnye") || cat.includes("молоч") || slug.includes("milk") || slug.includes("tvorog") || slug.includes("cheese")) {
    return {
      badge: "🥛 Натуральное молоко",
      calories: "~64 ккал",
      proteins: "3.2 г",
      fats: "3.2 г",
      carbs: "4.7 г",
      storage: "Хранить при температуре от +2°C до +6°C в сухом месте",
    };
  }

  if (cat.includes("khleb") || cat.includes("хлеб") || cat.includes("vypechka") || slug.includes("baget") || slug.includes("croissant")) {
    return {
      badge: "🥖 Свежая выпечка",
      calories: "~265 ккал",
      proteins: "8.5 г",
      fats: "1.8 г",
      carbs: "51.0 г",
      storage: "Хранить в сухом прохладном месте при температуре до +25°C",
    };
  }

  if (cat.includes("krupy") || cat.includes("круп") || cat.includes("makaron")) {
    return {
      badge: "🌾 Отборные злаки",
      calories: "~340 ккал",
      proteins: "12.0 г",
      fats: "2.0 г",
      carbs: "68.0 г",
      storage: "Хранить в сухом месте с относительной влажностью не более 70%",
    };
  }

  return {
    badge: "🌿 Свежий урожай",
    calories: "~42 ккал",
    proteins: "1.2 г",
    fats: "0.3 г",
    carbs: "8.5 г",
    storage: "Хранить при температуре от +4°C до +8°C в вентилируемом отсеке",
  };
};

