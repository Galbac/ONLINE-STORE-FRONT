import Link from "next/link";
import { ArrowRight, Clock, MapPinned, ShieldCheck, Truck } from "lucide-react";
import { categoryApi, type CategoryShortResponse } from "@/entities/category";
import { deliveryApi } from "@/entities/delivery";
import { discountApi, type DiscountShortResponse } from "@/entities/discount";
import { productApi, type ProductShortResponse } from "@/entities/product";
import { ROUTES } from "@/shared/config";
import { toPriceFormat } from "@/shared/lib/format";
import { Container, ProductCard, Section } from "@/shared/ui";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";

export const HomePage = async () => {
  const [
    categoryTree,
    categories,
    popularProducts,
    discountedProducts,
    newProducts,
    discounts,
    delivery,
  ] = await Promise.all([
    categoryApi.getTree(),
    categoryApi.getList(),
    productApi.getPopular(),
    productApi.getDiscounted(),
    productApi.getNew(),
    discountApi.getActive(),
    deliveryApi.getOptions(),
  ]);

  const visibleCategories: CategoryShortResponse[] =
    categories.items.length > 0 ? categories.items : categoryTree.items;

  return (
    <>
      <Header />
      <main>
        <Container className="py-6">
          <Hero />
          <CategorySection categories={visibleCategories.slice(0, 6)} />
          <PromoStrip discounts={discounts.items} />
          <ProductSection
            products={popularProducts.items}
            title="Популярные товары"
            href={ROUTES.CATALOG}
          />
          <ProductSection
            products={discountedProducts.items}
            title="Товары со скидкой"
            href="/catalog?has_discount=true"
          />
          <DeliveryBlock
            deliveryTitle={delivery.delivery.title}
            deliveryDescription={delivery.delivery.description}
            deliveryPrice={delivery.delivery.base_price ?? delivery.delivery.price}
            freeFromAmount={delivery.delivery.free_from_amount}
            pickupTitle={delivery.pickup.title}
            pickupDescription={delivery.pickup.description}
          />
          <ProductSection
            products={newProducts.items}
            title="Новинки"
            href="/catalog?sort=newest"
          />
        </Container>
      </main>
      <Footer />
    </>
  );
};

const Hero = () => {
  return (
    <section className="hero-fruit border-border shadow-soft min-h-[315px] overflow-hidden rounded-lg border px-8 py-12 md:px-10">
      <div className="max-w-xl">
        <span className="bg-bg-hover text-accent-primary mb-3 inline-flex rounded-full px-4 py-2 text-sm font-bold">
          Доставка свежих продуктов каждый день
        </span>
        <h1 className="text-text-primary text-4xl leading-tight font-bold md:text-5xl">
          Свежие продукты для всей семьи
        </h1>
        <p className="text-text-secondary mt-5 text-lg leading-8">
          Спелые фрукты, фермерские овощи, молочные продукты и готовые решения для быстрых домашних
          покупок.
        </p>
        <Link
          className="bg-accent-primary hover:bg-accent-hover mt-7 inline-flex h-12 items-center gap-2 rounded-lg px-6 text-sm font-bold text-white transition"
          href={ROUTES.CATALOG}
        >
          Перейти в каталог
          <ArrowRight size={18} />
        </Link>
      </div>
    </section>
  );
};

interface CategorySectionProps {
  categories: CategoryShortResponse[];
}

const CategorySection = ({ categories }: CategorySectionProps) => {
  return (
    <Section href={ROUTES.CATALOG} title="Категории">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {categories.map((category) => (
          <Link
            className="group border-border bg-bg-primary hover:shadow-soft min-h-36 rounded-lg border p-4 shadow-[0_10px_26px_rgb(20_28_18/0.06)] transition hover:-translate-y-1"
            href={ROUTES.CATEGORY(category.slug)}
            key={category.id}
          >
            <span className="block text-5xl leading-none">
              <ShieldCheck size={34} />
            </span>
            <span className="mt-5 flex items-center justify-between gap-3 text-sm font-bold">
              {category.name}
              <ArrowRight
                className="text-text-muted group-hover:text-accent-primary shrink-0 transition"
                size={16}
              />
            </span>
            {category.products_count ? (
              <span className="text-text-muted mt-1 block text-xs">
                {category.products_count} товаров
              </span>
            ) : null}
          </Link>
        ))}
      </div>
    </Section>
  );
};

interface PromoStripProps {
  discounts: DiscountShortResponse[];
}

const PromoStrip = ({ discounts }: PromoStripProps) => {
  return (
    <section className="grid gap-4 py-7 md:grid-cols-3">
      {discounts.slice(0, 3).map((discount) => (
        <article
          className="border-border bg-bg-secondary rounded-lg border p-5 shadow-[0_10px_26px_rgb(20_28_18/0.05)]"
          key={discount.id}
        >
          <span className="text-accent-primary text-sm font-bold">Акция</span>
          <h2 className="mt-2 text-xl font-bold">{discount.name}</h2>
          <p className="text-text-secondary mt-3 text-sm leading-6">
            {discount.discount_type === "percent"
              ? `Скидка ${Number(discount.discount_value)}% на выбранные товары.`
              : "Специальные условия для вашей корзины."}
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
}

const ProductSection = ({ title, href, products }: ProductSectionProps) => {
  return (
    <Section href={href} title={title}>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {products.slice(0, 8).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </Section>
  );
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
    <section className="border-border bg-bg-secondary my-7 grid overflow-hidden rounded-lg border md:grid-cols-2">
      <div className="border-border border-b p-7 md:border-r md:border-b-0">
        <Truck className="text-accent-primary mb-5" size={34} />
        <h2 className="text-2xl font-bold">{deliveryTitle}</h2>
        <p className="text-text-secondary mt-3 leading-7">{deliveryDescription}</p>
        <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          <span className="bg-bg-primary flex items-center gap-2 rounded-lg p-3">
            <Clock size={18} className="text-accent-primary" />
            Сегодня или завтра
          </span>
          <span className="bg-bg-primary flex items-center gap-2 rounded-lg p-3">
            <ShieldCheck size={18} className="text-accent-primary" />
            От {toPriceFormat(deliveryPrice)}
          </span>
        </div>
        {freeFromAmount ? (
          <p className="text-accent-primary mt-4 text-sm font-bold">
            Бесплатно от {toPriceFormat(freeFromAmount)}
          </p>
        ) : null}
      </div>
      <div className="p-7">
        <MapPinned className="text-accent-primary mb-5" size={34} />
        <h2 className="text-2xl font-bold">{pickupTitle}</h2>
        <p className="text-text-secondary mt-3 leading-7">{pickupDescription}</p>
        <Link
          className="border-border bg-bg-primary hover:bg-bg-hover mt-6 inline-flex h-12 items-center gap-2 rounded-lg border px-5 text-sm font-bold transition"
          href="#"
        >
          Найти ближайший магазин
          <ArrowRight size={18} />
        </Link>
      </div>
    </section>
  );
};
