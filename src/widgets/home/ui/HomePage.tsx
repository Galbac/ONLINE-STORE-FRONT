import { cookies } from "next/headers";
import Link from "next/link";
import {
  Apple,
  ArrowRight,
  Beef,
  CheckCircle2,
  Clock,
  Coffee,
  Cookie,
  Leaf,
  MapPinned,
  Milk,
  Percent,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  Wheat,
} from "lucide-react";
import { cartApi, emptyCartResponse } from "@/entities/cart";
import { categoryApi, type CategoryShortResponse } from "@/entities/category";
import { deliveryApi } from "@/entities/delivery";
import { discountApi, type DiscountShortResponse } from "@/entities/discount";
import { emptyFavoritesResponse, favoriteApi } from "@/entities/favorite";
import { productApi, type ProductShortResponse } from "@/entities/product";
import { CatalogCartButton, CatalogFavoriteButton } from "@/features/catalog-product-actions";
import { apiClient, fallbackOnUnauthorized } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import { toPriceFormat } from "@/shared/lib/format";
import { Container, ProductCard, Section } from "@/shared/ui";
import { Footer } from "@/widgets/footer";
import { QuickRepeatOrderBanner } from "./QuickRepeatOrderBanner";
import { Header } from "@/widgets/header";

export const HomePage = async () => {
  const accessToken = await getAccessToken();
  const [
    categoryTree,
    categories,
    popularProducts,
    discountedProducts,
    newProducts,
    discounts,
    delivery,
    cart,
    favorites,
    banners,
  ] = await Promise.all([
    categoryApi.getTree(),
    categoryApi.getList(),
    productApi.getPopular(),
    discountApi.getProducts(),
    productApi.getNew(),
    discountApi.getActive(),
    deliveryApi.getOptions(),
    fallbackOnUnauthorized(cartApi.get(), emptyCartResponse),
    fallbackOnUnauthorized(
      favoriteApi.getList({ page: 1, limit: 100 }, accessToken),
      emptyFavoritesResponse,
    ),
    apiClient.get<{ items: any[] }>("/api/banners").catch(() => ({ items: [] })),
  ]);

  const visibleCategories: CategoryShortResponse[] =
    categories.items.length > 0 ? categories.items : categoryTree.items;
  const cartProductIds = new Set(cart.items.map((item) => item.product_id));
  const favoriteProductIds = new Set(favorites.items.map((product) => product.id));

  return (
    <>
      <Header />
      <main className="space-y-12 pb-16">
        <Container className="pt-6">
          <Hero />
        </Container>

        <Container className="pt-2 sm:pt-4">
          <QuickRepeatOrderBanner />
        </Container>

        {banners?.items && banners.items.length > 0 ? (
          <Container>
            <PromoBanners banners={banners.items} />
          </Container>
        ) : null}

        <Container>
          <CategorySection categories={visibleCategories.slice(0, 8)} />
        </Container>

        {discounts.items.length > 0 ? (
          <Container>
            <PromoStrip discounts={discounts.items} />
          </Container>
        ) : null}

        {popularProducts.items.length > 0 ? (
          <Container>
            <ProductSection
              cartProductIds={cartProductIds}
              favoriteProductIds={favoriteProductIds}
              products={popularProducts.items}
              title="Популярные товары"
              href={ROUTES.CATALOG}
              badge="Хиты продаж"
            />
          </Container>
        ) : null}

        {discountedProducts.items.length > 0 ? (
          <Container>
            <ProductSection
              cartProductIds={cartProductIds}
              favoriteProductIds={favoriteProductIds}
              products={discountedProducts.items}
              title="Товары со скидкой"
              href="/catalog?has_discount=true"
              badge="Выгодные цены"
            />
          </Container>
        ) : null}

        <Container>
          <DeliveryBlock
            deliveryTitle={delivery.delivery.title}
            deliveryDescription={delivery.delivery.description}
            deliveryPrice={delivery.delivery.base_price ?? delivery.delivery.price}
            freeFromAmount={delivery.delivery.free_from_amount}
            pickupTitle={delivery.pickup.title}
            pickupDescription={delivery.pickup.description}
          />
        </Container>

        {newProducts.items.length > 0 ? (
          <Container>
            <ProductSection
              cartProductIds={cartProductIds}
              favoriteProductIds={favoriteProductIds}
              products={newProducts.items}
              title="Новинки каталога"
              href="/catalog?sort=newest"
              badge="Новые поступления"
            />
          </Container>
        ) : null}
      </main>
      <Footer />
    </>
  );
};

const Hero = () => {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-950 p-8 text-white shadow-2xl sm:p-12 lg:p-16">
      {/* Glow shapes */}
      <div className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-emerald-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 size-96 rounded-full bg-teal-500/10 blur-3xl" />

      <div className="relative z-10 max-w-2xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-900/50 px-4 py-1.5 text-xs font-semibold tracking-wide text-emerald-300 backdrop-blur-md">
          <Sparkles className="text-emerald-400" size={14} />
          <span>Быстрая доставка от 45 минут</span>
          <span className="text-emerald-500">•</span>
          <span>100% свежесть</span>
        </div>

        <h1 className="mt-6 text-3xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl leading-[1.15]">
          Свежие продукты{" "}
          <span className="bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
            прямо к вашему столу
          </span>
        </h1>

        <p className="mt-5 text-base sm:text-lg leading-relaxed text-slate-300">
          Спелые фрукты, фермерские молочные продукты, свежая выпечка и готовые решения для
          всей семьи с быстрой и бережной доставкой.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            className="inline-flex h-12 items-center gap-2.5 rounded-xl bg-emerald-500 px-7 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:scale-105 hover:bg-emerald-400 active:scale-95"
            href={ROUTES.CATALOG}
          >
            Перейти в каталог
            <ArrowRight size={18} />
          </Link>
          <Link
            className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 text-sm font-semibold text-white backdrop-blur-md transition-all duration-200 hover:bg-white/10 active:scale-95"
            href="/catalog?has_discount=true"
          >
            <Percent size={16} className="text-emerald-400" />
            Акции и скидки
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-8 sm:gap-6">
          <div>
            <span className="block text-2xl font-black text-emerald-400 sm:text-3xl">1 000+</span>
            <span className="mt-1 block text-xs font-medium text-slate-400 sm:text-sm">
              Товаров в каталоге
            </span>
          </div>
          <div>
            <span className="block text-2xl font-black text-emerald-400 sm:text-3xl">45 мин</span>
            <span className="mt-1 block text-xs font-medium text-slate-400 sm:text-sm">
              Среднее время доставки
            </span>
          </div>
          <div>
            <span className="block text-2xl font-black text-emerald-400 sm:text-3xl">100%</span>
            <span className="mt-1 block text-xs font-medium text-slate-400 sm:text-sm">
              Гарантия свежести
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

interface CategorySectionProps {
  categories: CategoryShortResponse[];
}

const CategorySection = ({ categories }: CategorySectionProps) => {
  return (
    <Section href={ROUTES.CATALOG} title="Популярные категории">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
        {categories.map((category) => {
          const { Icon, colorClass } = getCategoryMeta(category.name);

          return (
            <Link
              className="group relative flex flex-col items-center justify-center rounded-2xl border border-slate-200/70 bg-white p-4 text-center shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-950/5"
              href={ROUTES.CATEGORY(category.slug)}
              key={category.id}
            >
              <span
                className={`mb-3 flex size-15 items-center justify-center rounded-2xl ${colorClass} transition-transform duration-300 group-hover:scale-110 shadow-xs`}
              >
                <Icon size={28} />
              </span>
              <span className="line-clamp-2 text-xs font-bold text-slate-800 transition-colors group-hover:text-emerald-700 leading-tight">
                {category.name}
              </span>
              {category.products_count ? (
                <span className="mt-1 text-[11px] font-medium text-slate-400">
                  {category.products_count} {formatProductsCount(category.products_count)}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </Section>
  );
};

const getCategoryMeta = (
  name: string,
): { Icon: typeof Apple; colorClass: string } => {
  const lower = name.toLowerCase();

  if (lower.includes("фрукт") || lower.includes("ягод")) {
    return { Icon: Apple, colorClass: "bg-amber-50 text-amber-600" };
  }
  if (lower.includes("овощ") || lower.includes("зелен")) {
    return { Icon: Leaf, colorClass: "bg-emerald-50 text-emerald-600" };
  }
  if (lower.includes("молок") || lower.includes("сыр") || lower.includes("творог")) {
    return { Icon: Milk, colorClass: "bg-blue-50 text-blue-600" };
  }
  if (lower.includes("мясо") || lower.includes("птиц") || lower.includes("рыб")) {
    return { Icon: Beef, colorClass: "bg-rose-50 text-rose-600" };
  }
  if (lower.includes("хлеб") || lower.includes("выпечк")) {
    return { Icon: Wheat, colorClass: "bg-orange-50 text-orange-600" };
  }
  if (lower.includes("напит") || lower.includes("сок") || lower.includes("вод")) {
    return { Icon: Coffee, colorClass: "bg-cyan-50 text-cyan-600" };
  }
  if (lower.includes("слад") || lower.includes("конфет") || lower.includes("шоколад")) {
    return { Icon: Cookie, colorClass: "bg-purple-50 text-purple-600" };
  }

  return { Icon: ShoppingBag, colorClass: "bg-emerald-50 text-emerald-600" };
};

interface PromoStripProps {
  discounts: DiscountShortResponse[];
}

const PromoStrip = ({ discounts }: PromoStripProps) => {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {discounts.slice(0, 3).map((discount, index) => (
        <article
          className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm transition-all duration-300 hover:border-emerald-500/30 hover:shadow-md"
          key={discount.id}
        >
          <div className="flex items-start justify-between gap-4">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-600">
              <Percent size={13} />
              Акция дня
            </span>
            <span className="text-2xl font-black text-slate-200">0{index + 1}</span>
          </div>
          <h2 className="mt-3 text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
            {discount.name}
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            {discount.discount_type === "percent"
              ? `Выгода до ${Number(discount.discount_value)}% на избранный ассортимент товаров.`
              : "Специальные выгодные условия для вашей корзины."}
          </p>
        </article>
      ))}
    </section>
  );
};

interface ProductSectionProps {
  title: string;
  href: string;
  products: ProductShortResponse[];
  cartProductIds: Set<number>;
  favoriteProductIds: Set<number>;
  badge?: string;
}

const ProductSection = ({
  badge,
  cartProductIds,
  favoriteProductIds,
  href,
  products,
  title,
}: ProductSectionProps) => {
  return (
    <Section href={href} title={title}>
      {badge ? (
        <span className="-mt-3 mb-4 inline-block text-xs font-semibold text-emerald-700">
          {badge}
        </span>
      ) : null}
      <div className="grid grid-cols-2 gap-3.5 sm:gap-4 lg:grid-cols-4">
        {products.slice(0, 8).map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            initialInCart={cartProductIds.has(product.id)}
            cartControl={
              <CatalogCartButton
                initialInCart={cartProductIds.has(product.id)}
                productId={product.id}
                productName={product.name}
                minQuantity={product.min_quantity}
                            quantityStep={product.quantity_step}
                            unit={product.unit}
              />
            }
            favoriteControl={
              <CatalogFavoriteButton
                initialFavorite={favoriteProductIds.has(product.id)}
                productId={product.id}
                productName={product.name}
              />
            }
          />
        ))}
      </div>
    </Section>
  );
};

const getAccessToken = async (): Promise<string | undefined> => {
  const cookieStore = await cookies();

  return cookieStore.get("access_token")?.value;
};

interface DeliveryBlockProps {
  deliveryTitle: string;
  deliveryDescription?: string | null | undefined;
  deliveryPrice?: string | null | undefined;
  freeFromAmount?: string | null | undefined;
  pickupTitle: string;
  pickupDescription?: string | null | undefined;
}

const DeliveryBlock = ({
  deliveryTitle,
  deliveryDescription,
  deliveryPrice,
  freeFromAmount,
  pickupTitle,
  pickupDescription,
}: DeliveryBlockProps) => {
  return (
    <section className="grid gap-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm md:grid-cols-2 lg:p-8">
      <div className="flex flex-col justify-between rounded-2xl bg-gradient-to-br from-emerald-50/70 to-teal-50/40 p-6 sm:p-8 border border-emerald-100/60">
        <div>
          <span className="flex size-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-700/20">
            <Truck size={24} />
          </span>
          <h2 className="mt-5 text-2xl font-black text-slate-900">{deliveryTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{deliveryDescription}</p>

          <div className="mt-6 grid gap-2.5 text-xs sm:grid-cols-2">
            <span className="flex items-center gap-2 rounded-xl bg-white/90 p-3 font-semibold text-slate-800 shadow-xs">
              <Clock size={16} className="text-emerald-600" />
              Сегодня за 45-60 минут
            </span>
            <span className="flex items-center gap-2 rounded-xl bg-white/90 p-3 font-semibold text-slate-800 shadow-xs">
              <CheckCircle2 size={16} className="text-emerald-600" />
              От {toPriceFormat(deliveryPrice)}
            </span>
          </div>
        </div>

        {freeFromAmount ? (
          <div className="mt-6 rounded-xl bg-emerald-600/10 px-4 py-3 text-xs font-bold text-emerald-800">
            🎉 Бесплатная доставка при заказе от {toPriceFormat(freeFromAmount)}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col justify-between rounded-2xl bg-slate-50 p-6 sm:p-8 border border-slate-200/60">
        <div>
          <span className="flex size-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md">
            <Store size={24} />
          </span>
          <h2 className="mt-5 text-2xl font-black text-slate-900">{pickupTitle}</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{pickupDescription}</p>

          <div className="mt-6 space-y-2.5 text-xs">
            <span className="flex items-center gap-2 rounded-xl bg-white p-3 font-semibold text-slate-800 shadow-xs">
              <MapPinned size={16} className="text-emerald-600" />
              Удобные пункты выдачи в вашем районе
            </span>
            <span className="flex items-center gap-2 rounded-xl bg-white p-3 font-semibold text-slate-800 shadow-xs">
              <CheckCircle2 size={16} className="text-emerald-600" />
              Готовность к выдаче через 15 минут
            </span>
          </div>
        </div>

        <Link
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 text-xs font-bold text-white shadow-sm transition-all hover:bg-slate-800 active:scale-95"
          href={ROUTES.CHECKOUT}
        >
          Выбрать пункт самовывоза
          <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
};

interface BannerItem {
  id: number;
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  link?: string | null;
  bg_color?: string;
}

const PromoBanners = ({ banners }: { banners: BannerItem[] }) => {
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {banners.slice(0, 3).map((b) => (
        <Link
          key={b.id}
          href={b.link || "/catalog"}
          className="group relative flex flex-col justify-between overflow-hidden rounded-3xl p-6 text-white shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-xl"
          style={{ backgroundColor: b.bg_color || "#059669" }}
        >
          <div>
            {b.badge ? (
              <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold backdrop-blur-md">
                {b.badge}
              </span>
            ) : null}
            <h3 className="mt-3 text-xl font-extrabold leading-tight">{b.title}</h3>
            {b.subtitle ? <p className="mt-1 text-xs text-white/80">{b.subtitle}</p> : null}
          </div>
          <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-white group-hover:translate-x-1 transition-transform">
            Смотреть акцию <ArrowRight size={14} />
          </span>
        </Link>
      ))}
    </section>
  );
};

const formatProductsCount = (count: number): string => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 19) return "товаров";
  if (mod10 === 1) return "товар";
  if (mod10 >= 2 && mod10 <= 4) return "товара";
  return "товаров";
};
