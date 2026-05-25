import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Grid2X2, List } from "lucide-react";
import { cartApi, emptyCartResponse } from "@/entities/cart";
import {
  categoryApi,
  type CategoryBreadcrumbResponse,
  type CategoryDetailResponse,
  type CategoryShortResponse,
} from "@/entities/category";
import { emptyFavoritesResponse, favoriteApi } from "@/entities/favorite";
import { productApi, type ProductListParams } from "@/entities/product";
import { CatalogCartButton, CatalogFavoriteButton } from "@/features/catalog-product-actions";
import { fallbackOnUnauthorized } from "@/shared/api";
import { cn, ROUTES } from "@/shared/config";
import { Container, ProductCard } from "@/shared/ui";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";

interface CategoryPageProps {
  slug: string;
  searchParams: CategorySearchParams;
}

interface CategorySearchParams {
  page?: string;
  in_stock?: string;
  sort?: ProductListParams["sort"];
}

const sortOptions: Array<{ label: string; value: NonNullable<ProductListParams["sort"]> }> = [
  { label: "По популярности", value: "popular" },
  { label: "Сначала новинки", value: "newest" },
  { label: "По цене: по возрастанию", value: "price_asc" },
  { label: "По цене: по убыванию", value: "price_desc" },
  { label: "По названию", value: "name_asc" },
];

export const CategoryPage = async ({ searchParams, slug }: CategoryPageProps) => {
  const page = toPositiveNumber(searchParams.page, 1);
  const inStock = searchParams.in_stock !== "false";
  const sort = toCategorySort(searchParams.sort);

  const categoryBySlug = await categoryApi.getBySlug(slug);
  const category = await categoryApi.getById(categoryBySlug.id);

  const [products, cart, favorites] = await Promise.all([
    productApi.getList({
      page,
      limit: 24,
      category_id: category.id,
      category_slug: category.slug,
      in_stock: inStock,
      sort,
    }),
    fallbackOnUnauthorized(cartApi.get(), emptyCartResponse),
    fallbackOnUnauthorized(favoriteApi.getList(), emptyFavoritesResponse),
  ]);

  const childCategories = category.children ?? [];
  const favoriteProductIds = new Set(favorites.items.map((product) => product.id));
  const cartProductIds = new Set(cart.items.map((item) => item.product_id));

  return (
    <>
      <Header />
      <main>
        <Container className="py-6">
          <CategoryBreadcrumbs breadcrumbs={category.breadcrumbs} categoryName={category.name} />
          <CategoryHero category={category} />

          {childCategories.length > 0 ? (
            <section className="mt-8">
              <h2 className="mb-4 text-xl font-bold">Подкатегории</h2>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                {childCategories.map((subcategory) => (
                  <SubcategoryCard key={subcategory.id} subcategory={subcategory} />
                ))}
              </div>
            </section>
          ) : null}

          <section className="mt-8">
            <CategoryToolbar
              category={category}
              inStock={inStock}
              productsTotal={products.total}
              sort={sort}
            />

            <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
              {products.items.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  cartControl={
                    <CatalogCartButton
                      initialInCart={cartProductIds.has(product.id)}
                      productId={product.id}
                      productName={product.name}
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

            <CategoryPagination
              currentPage={products.page || page}
              searchParams={searchParams}
              slug={category.slug}
              totalPages={products.pages}
            />
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
};

interface CategoryBreadcrumbsProps {
  breadcrumbs?: CategoryBreadcrumbResponse[] | null | undefined;
  categoryName: string;
}

const CategoryBreadcrumbs = ({ breadcrumbs, categoryName }: CategoryBreadcrumbsProps) => {
  const items = breadcrumbs?.length ? breadcrumbs : [{ id: 0, name: categoryName, slug: "" }];

  return (
    <nav className="text-text-secondary mb-5 flex flex-wrap items-center gap-2 text-sm">
      <Link className="hover:text-accent-primary" href={ROUTES.HOME}>
        Главная
      </Link>
      <span>/</span>
      <Link className="hover:text-accent-primary" href={ROUTES.CATALOG}>
        Каталог
      </Link>
      {items.map((item, index) => (
        <span className="contents" key={`${item.id}-${item.slug || item.name}`}>
          <span>/</span>
          {index === items.length - 1 ? (
            <span>{item.name}</span>
          ) : (
            <Link className="hover:text-accent-primary" href={ROUTES.CATEGORY(item.slug)}>
              {item.name}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
};

interface CategoryHeroProps {
  category: CategoryDetailResponse;
}

const CategoryHero = ({ category }: CategoryHeroProps) => {
  const heroStyle: CSSProperties | undefined = category.image_url
    ? {
        backgroundImage: `linear-gradient(90deg, rgb(255 255 255 / 0.98) 0%, rgb(255 255 255 / 0.86) 40%, rgb(255 255 255 / 0.08) 70%), url("${category.image_url}")`,
      }
    : undefined;

  return (
    <section
      className={cn(
        "border-border shadow-soft min-h-[255px] overflow-hidden rounded-lg border px-7 py-10 md:px-9",
        category.image_url ? "bg-cover bg-center" : "hero-fruit",
      )}
      style={heroStyle}
    >
      <div className="max-w-lg">
        <h1 className="text-text-primary text-4xl leading-tight font-bold md:text-5xl">
          {category.name}
        </h1>
        {category.description ? (
          <p className="text-text-secondary mt-5 text-base leading-8 md:text-lg">
            {category.description}
          </p>
        ) : null}
      </div>
    </section>
  );
};

interface SubcategoryCardProps {
  subcategory: CategoryShortResponse;
}

const SubcategoryCard = ({ subcategory }: SubcategoryCardProps) => {
  return (
    <Link
      className="group border-border bg-bg-primary hover:shadow-soft flex min-h-32 flex-col justify-between rounded-lg border p-4 shadow-[0_10px_26px_rgb(20_28_18/0.06)] transition hover:-translate-y-1"
      href={ROUTES.CATEGORY(subcategory.slug)}
    >
      <span className="flex h-16 items-center justify-center">
        {subcategory.image_url ? (
          <Image
            alt={subcategory.name}
            className="h-full w-full object-contain"
            height={72}
            src={subcategory.image_url}
            width={120}
          />
        ) : (
          <Grid2X2 className="text-accent-primary" size={36} />
        )}
      </span>
      <span className="mt-4 flex items-center justify-between gap-3 text-sm font-bold">
        <span className="line-clamp-2">{subcategory.name}</span>
        <ChevronRight
          className="text-text-muted group-hover:text-accent-primary shrink-0 transition"
          size={16}
        />
      </span>
    </Link>
  );
};

interface CategoryToolbarProps {
  category: CategoryDetailResponse;
  productsTotal: number;
  inStock: boolean;
  sort: ProductListParams["sort"];
}

const CategoryToolbar = ({ category, inStock, productsTotal, sort }: CategoryToolbarProps) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <Link
          className={cn(
            "border-border bg-bg-primary flex h-12 items-center gap-4 rounded-lg border px-5 text-sm font-semibold transition",
            inStock ? "text-text-primary" : "text-text-secondary",
          )}
          href={buildCategoryHref(category.slug, {
            in_stock: inStock ? "false" : "true",
            page: undefined,
            sort,
          })}
        >
          Только в наличии
          <span
            className={cn(
              "relative h-7 w-12 rounded-full transition",
              inStock ? "bg-accent-primary" : "bg-border",
            )}
          >
            <span
              className={cn(
                "absolute top-1 size-5 rounded-full bg-white transition",
                inStock ? "right-1" : "left-1",
              )}
            />
          </span>
        </Link>
        <p className="text-text-secondary text-sm">Найдено {productsTotal} товара</p>
      </div>

      <div className="flex max-w-full flex-wrap items-center gap-4">
        <form
          className="border-border bg-bg-primary flex h-12 min-w-0 items-center gap-3 rounded-lg border px-4"
          action={ROUTES.CATEGORY(category.slug)}
        >
          <span className="text-text-secondary hidden text-sm sm:inline">Сортировать:</span>
          <select
            className="min-w-0 bg-transparent text-sm outline-none"
            name="sort"
            defaultValue={sort}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input name="in_stock" type="hidden" value={String(inStock)} />
          <button className="sr-only" type="submit">
            Сортировать
          </button>
        </form>
        <div className="border-border bg-bg-primary flex h-12 items-center gap-2 rounded-lg border px-3">
          <Grid2X2 className="text-accent-primary" size={22} />
          <List className="text-text-muted" size={22} />
        </div>
      </div>
    </div>
  );
};

interface CategoryPaginationProps {
  currentPage: number;
  totalPages: number;
  slug: string;
  searchParams: CategorySearchParams;
}

const CategoryPagination = ({
  currentPage,
  searchParams,
  slug,
  totalPages,
}: CategoryPaginationProps) => {
  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, index) => index + 1);

  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <PageLink
          disabled={currentPage <= 1}
          page={currentPage - 1}
          searchParams={searchParams}
          slug={slug}
        >
          ‹
        </PageLink>
        {pages.map((page) => (
          <PageLink
            active={page === currentPage}
            key={page}
            page={page}
            searchParams={searchParams}
            slug={slug}
          >
            {page}
          </PageLink>
        ))}
        {totalPages > 6 ? <span className="text-text-muted px-2">...</span> : null}
        {totalPages > 5 ? (
          <PageLink page={totalPages} searchParams={searchParams} slug={slug}>
            {totalPages}
          </PageLink>
        ) : null}
        <PageLink
          disabled={currentPage >= totalPages}
          page={currentPage + 1}
          searchParams={searchParams}
          slug={slug}
        >
          ›
        </PageLink>
      </div>
      <div className="text-text-secondary flex items-center gap-3 text-sm">
        Показать по:
        <select
          className="border-border bg-bg-primary h-11 rounded-lg border px-4 outline-none"
          defaultValue="24"
        >
          <option>24</option>
        </select>
      </div>
    </div>
  );
};

interface PageLinkProps {
  active?: boolean;
  disabled?: boolean;
  page: number;
  slug: string;
  searchParams: CategorySearchParams;
  children: ReactNode;
}

const PageLink = ({ active, children, disabled, page, searchParams, slug }: PageLinkProps) => {
  if (disabled) {
    return (
      <span className="border-border text-text-muted grid size-10 place-items-center rounded-lg border">
        {children}
      </span>
    );
  }

  return (
    <Link
      className={cn(
        "border-border grid size-10 place-items-center rounded-lg border text-sm font-semibold transition",
        active
          ? "border-accent-primary bg-accent-primary text-white"
          : "bg-bg-primary hover:bg-bg-hover",
      )}
      href={buildCategoryHref(slug, { ...searchParams, page: String(page) })}
    >
      {children}
    </Link>
  );
};

const toPositiveNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
};

const toCategorySort = (
  value: ProductListParams["sort"] | undefined,
): NonNullable<ProductListParams["sort"]> => {
  const option = sortOptions.find((sortOption) => sortOption.value === value);

  return option?.value ?? "popular";
};

const buildCategoryHref = (slug: string, params: Record<string, string | undefined>): string => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      query.set(key, value);
    }
  });

  const queryString = query.toString();
  const pathname = ROUTES.CATEGORY(slug);

  return queryString ? `${pathname}?${queryString}` : pathname;
};
