import type { CSSProperties, ReactNode } from "react";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Grid2X2, RotateCcw } from "lucide-react";
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
import { AutoSubmitSelect, Container, ProductCard, ViewModeToggle } from "@/shared/ui";
import type { ProductViewMode } from "@/shared/ui";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";
import { CatalogPriceFilter } from "@/widgets/catalog/ui/CatalogPriceFilter";
import { ProductTypeFilter } from "@/widgets/catalog/ui/ProductTypeFilter";
import { DietaryFilter } from "@/widgets/catalog/ui/DietaryFilter";
import { QuickFilterChips } from "@/widgets/catalog/ui/QuickFilterChips";

interface CategoryPageProps {
  slug: string;
  searchParams: CategorySearchParams;
}

interface CategorySearchParams {
  page?: string;
  limit?: string;
  in_stock?: string;
  has_discount?: string;
  min_price?: string;
  max_price?: string;
  product_type?: ProductListParams["product_type"];
  tag?: string;
  sort?: ProductListParams["sort"];
  view?: ProductViewMode;
}

const sortOptions: Array<{ label: string; value: NonNullable<ProductListParams["sort"]> }> = [
  { label: "По популярности", value: "popular" },
  { label: "Сначала новинки", value: "newest" },
  { label: "По цене: по возрастанию", value: "price_asc" },
  { label: "По цене: по убыванию", value: "price_desc" },
  { label: "По названию", value: "name_asc" },
];

const pageSizeOptions = [
  { label: "24", value: "24" },
  { label: "48", value: "48" },
  { label: "96", value: "96" },
] as const;

export const CategoryPage = async ({ searchParams, slug }: CategoryPageProps) => {
  const page = toPositiveNumber(searchParams.page, 1);
  const pageSize = toPageSize(searchParams.limit);
  const inStock = searchParams.in_stock !== "false";
  const hasDiscount = searchParams.has_discount === "true";
  const minPrice = toOptionalPrice(searchParams.min_price);
  const maxPrice = toOptionalPrice(searchParams.max_price);
  const productType =
    searchParams.product_type === "piece" || searchParams.product_type === "weight"
      ? searchParams.product_type
      : undefined;
  const tag = searchParams.tag?.trim() || undefined;
  const sort = toCategorySort(searchParams.sort);
  const viewMode = toViewMode(searchParams.view);
  const accessToken = await getAccessToken();

  const categoryBySlug = await categoryApi.getBySlug(slug);
  const category = await categoryApi.getById(categoryBySlug.id);

  const productParams: ProductListParams = {
    page,
    limit: pageSize,
    category_id: category.id,
    category_slug: category.slug,
    sort,
  };

  if (inStock) {
    productParams.in_stock = true;
  }
  if (hasDiscount) {
    productParams.has_discount = true;
  }
  if (minPrice !== undefined) {
    productParams.min_price = minPrice;
  }
  if (maxPrice !== undefined) {
    productParams.max_price = maxPrice;
  }
  if (productType !== undefined) {
    productParams.product_type = productType;
  }
  if (tag !== undefined) {
    productParams.tag = tag;
  }

  const [products, cart, favorites, priceBounds] = await Promise.all([
    productApi.getList(productParams),
    fallbackOnUnauthorized(cartApi.get(), emptyCartResponse),
    fallbackOnUnauthorized(
      favoriteApi.getList({ page: 1, limit: 100 }, accessToken),
      emptyFavoritesResponse,
    ),
    productApi.getList({
      category_id: category.id,
      limit: 1,
      page: 1,
      sort: "price_desc",
    }),
  ]);

  const maxCategoryPrice = priceBounds.items[0] ? Number(priceBounds.items[0].price) : 5000;
  const sliderMax = Math.ceil(Math.max(100, maxCategoryPrice) / 100) * 100;

  const childCategories = category.children ?? [];
  const favoriteProductIds = new Set(favorites.items.map((product) => product.id));
  const cartProductIds = new Set(cart.items.map((item) => item.product_id));

  const urlParamsRecord: Record<string, string | undefined> = {
    in_stock: inStock ? undefined : "false",
    has_discount: hasDiscount ? "true" : undefined,
    min_price: minPrice,
    max_price: maxPrice,
    product_type: productType,
    tag,
    sort: sort === "popular" ? undefined : sort,
    limit: searchParams.limit,
    view: viewMode === "list" ? "list" : undefined,
  };

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

          <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
            <CategoryFilters
              currentParams={urlParamsRecord}
              hasDiscount={hasDiscount}
              inStock={inStock}
              maxPrice={maxPrice}
              minPrice={minPrice}
              productType={productType}
              sliderMax={sliderMax}
              slug={slug}
              subcategories={childCategories}
            />

            <section className="min-w-0">
              <CategoryToolbar
                category={category}
                inStock={inStock}
                productsTotal={products.total}
                searchParams={searchParams}
                sort={sort}
                viewMode={viewMode}
              />

              <div className="my-6">
              <QuickFilterChips
                chips={[
                  {
                    id: "all",
                    label: "Все товары",
                    active: !hasDiscount && !productType && inStock && sort === "popular",
                    href: buildCategoryHref(slug, { ...urlParamsRecord, has_discount: undefined, product_type: undefined, in_stock: undefined, sort: undefined, page: undefined }),
                  },
                  {
                    id: "discount",
                    label: "🔥 Скидки",
                    active: hasDiscount,
                    href: buildCategoryHref(slug, { ...urlParamsRecord, has_discount: hasDiscount ? undefined : "true", page: undefined }),
                  },
                  {
                    id: "popular",
                    label: "⭐ Популярное",
                    active: sort === "popular",
                    href: buildCategoryHref(slug, { ...urlParamsRecord, sort: "popular", page: undefined }),
                  },
                  {
                    id: "newest",
                    label: "🆕 Новинки",
                    active: sort === "newest",
                    href: buildCategoryHref(slug, { ...urlParamsRecord, sort: "newest", page: undefined }),
                  },
                  {
                    id: "weight",
                    label: "⚖️ На развес",
                    active: productType === "weight",
                    href: buildCategoryHref(slug, { ...urlParamsRecord, product_type: productType === "weight" ? undefined : "weight", page: undefined }),
                  },
                  {
                    id: "piece",
                    label: "📦 Штучные",
                    active: productType === "piece",
                    href: buildCategoryHref(slug, { ...urlParamsRecord, product_type: productType === "piece" ? undefined : "piece", page: undefined }),
                  },
                ]}
                className="py-1"
              />
              </div>

              {products.items.length > 0 ? (
                <>
                  <div
                    className={cn(
                      "mt-4 grid gap-4",
                      viewMode === "grid"
                        ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
                        : "grid-cols-1",
                    )}
                  >
                    {products.items.map((product) => (
                      <ProductCard
                        cartControl={
                          <CatalogCartButton
                            initialInCart={cartProductIds.has(product.id)}
                            productId={product.id}
                            productName={product.name}
                            minQuantity={product.min_quantity}
                          />
                        }
                        favoriteControl={
                          <CatalogFavoriteButton
                            initialFavorite={favoriteProductIds.has(product.id)}
                            productId={product.id}
                            productName={product.name}
                          />
                        }
                        key={product.id}
                        product={product}
                        variant={viewMode}
                      />
                    ))}
                  </div>

                  <CategoryPagination
                    currentPage={page}
                    pageSize={pageSize}
                    searchParams={searchParams}
                    slug={category.slug}
                    totalPages={products.pages}
                  />
                </>
              ) : (
                <div className="border-border rounded-lg border bg-white p-8 text-center shadow-xs">
                  <h3 className="text-lg font-bold text-slate-800">В этой категории нет подходящих товаров</h3>
                  <p className="mt-2 text-xs text-slate-500">Попробуйте сбросить фильтры или выбрать другой диапазон цен.</p>
                  <Link
                    href={ROUTES.CATEGORY(slug)}
                    className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white transition hover:bg-emerald-700"
                  >
                    Сбросить фильтры
                  </Link>
                </div>
              )}
            </section>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
};

interface CategoryFiltersProps {
  currentParams: Record<string, string | undefined>;
  hasDiscount: boolean;
  inStock: boolean;
  maxPrice?: string | undefined;
  minPrice?: string | undefined;
  productType?: string | undefined;
  sliderMax: number;
  slug: string;
  subcategories: CategoryShortResponse[];
}

const CategoryFilters = ({
  currentParams,
  hasDiscount,
  inStock,
  maxPrice,
  minPrice,
  productType,
  sliderMax,
  slug,
  subcategories,
}: CategoryFiltersProps) => {
  return (
    <aside className="min-w-0 space-y-4">
      {subcategories.length > 0 && (
        <FilterPanel title="Подкатегории">
          <ul className="space-y-2">
            {subcategories.map((sub) => (
              <li key={sub.id}>
                <Link
                  href={ROUTES.CATEGORY(sub.slug)}
                  className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800"
                >
                  <span className="truncate">{sub.name}</span>
                  {sub.products_count !== undefined && (
                    <span className="text-slate-400 text-[11px]">{sub.products_count}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </FilterPanel>
      )}

      <FilterPanel>
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-sm font-bold">Только в наличии</h2>
            <p className="text-text-muted mt-1 text-xs leading-5">Товары на складе</p>
          </div>
          <Link
            className={cn(
              "relative h-8 w-14 shrink-0 rounded-full transition",
              inStock ? "bg-accent-primary" : "bg-border",
            )}
            href={buildCategoryHref(slug, {
              ...currentParams,
              in_stock: inStock ? "false" : "true",
              page: undefined,
            })}
            aria-label="Переключить фильтр наличия"
          >
            <span
              className={cn(
                "absolute top-1 grid size-6 place-items-center rounded-full bg-white transition",
                inStock ? "right-1" : "left-1",
              )}
            />
          </Link>
        </div>
      </FilterPanel>

      <FilterPanel>
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-sm font-bold">Акции и скидки</h2>
            <p className="text-text-muted mt-1 text-xs leading-5">Товары со скидкой</p>
          </div>
          <Link
            aria-label="Переключить фильтр акций"
            className={cn(
              "relative h-8 w-14 shrink-0 rounded-full transition",
              hasDiscount ? "bg-accent-primary" : "bg-border",
            )}
            href={buildCategoryHref(slug, {
              ...currentParams,
              has_discount: hasDiscount ? undefined : "true",
              page: undefined,
            })}
          >
            <span
              className={cn(
                "absolute top-1 grid size-6 place-items-center rounded-full bg-white transition",
                hasDiscount ? "right-1" : "left-1",
              )}
            />
          </Link>
        </div>
      </FilterPanel>

      <FilterPanel title="Диета и состав">
        <DietaryFilter
          currentTag={currentParams.tag}
          buildHref={(t) =>
            buildCategoryHref(slug, {
              ...currentParams,
              tag: t,
              page: undefined,
            })
          }
        />
      </FilterPanel>

      <FilterPanel title="Тип товара">
        <ProductTypeFilter
          currentType={productType}
          buildHref={(type) =>
            buildCategoryHref(slug, {
              ...currentParams,
              product_type: type,
              page: undefined,
            })
          }
        />
      </FilterPanel>

      <FilterPanel title="Цена, ₽">
        <CatalogPriceFilter
          action={ROUTES.CATEGORY(slug)}
          currentParams={currentParams}
          maxPrice={maxPrice}
          minPrice={minPrice}
          resetHref={buildCategoryHref(slug, {
            ...currentParams,
            max_price: undefined,
            min_price: undefined,
            page: undefined,
          })}
          sliderMax={sliderMax}
        />
      </FilterPanel>

      <Link
        className="border-border text-text-secondary hover:bg-bg-hover flex h-11 items-center justify-center gap-2 rounded-xl border text-xs font-bold transition"
        href={ROUTES.CATEGORY(slug)}
      >
        <RotateCcw size={14} />
        Сбросить все фильтры
      </Link>
    </aside>
  );
};

interface FilterPanelProps {
  title?: string;
  children: React.ReactNode;
}

const FilterPanel = ({ children, title }: FilterPanelProps) => {
  return (
    <section className="border-border bg-bg-primary rounded-lg border p-5 shadow-[0_10px_26px_rgb(20_28_18/0.05)]">
      {title ? <h2 className="mb-4 text-sm font-bold">{title}</h2> : null}
      {children}
    </section>
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
        "border-border shadow-soft min-h-[200px] overflow-hidden rounded-lg border px-7 py-8 md:px-9",
        category.image_url ? "bg-cover bg-center" : "hero-fruit",
      )}
      style={heroStyle}
    >
      <div className="max-w-lg">
        <h1 className="text-text-primary text-3xl leading-tight font-bold md:text-4xl">
          {category.name}
        </h1>
        {category.description ? (
          <p className="text-text-secondary mt-3 text-sm leading-6 md:text-base">
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
      className="border-border shadow-soft hover:border-accent-primary group flex flex-col justify-between rounded-lg border bg-white p-4 transition"
      href={ROUTES.CATEGORY(subcategory.slug)}
    >
      <div className="bg-bg-hover relative grid size-12 place-items-center overflow-hidden rounded-lg">
        {subcategory.image_url ? (
          <Image
            alt={subcategory.name}
            className="object-cover"
            fill
            sizes="48px"
            src={subcategory.image_url}
          />
        ) : (
          <Grid2X2 className="text-accent-primary" size={24} />
        )}
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div>
          <p className="group-hover:text-accent-primary text-sm font-bold transition">
            {subcategory.name}
          </p>
          <p className="text-text-secondary mt-1 text-xs">{subcategory.products_count ?? 0} товаров</p>
        </div>
        <ChevronRight
          className="text-text-secondary group-hover:text-accent-primary transition group-hover:translate-x-1"
          size={16}
        />
      </div>
    </Link>
  );
};

interface CategoryToolbarProps {
  category: CategoryDetailResponse;
  inStock: boolean;
  productsTotal: number;
  searchParams: CategorySearchParams;
  sort: NonNullable<ProductListParams["sort"]>;
  viewMode: ProductViewMode;
}

const CategoryToolbar = ({
  category,
  inStock,
  productsTotal,
  searchParams,
  sort,
  viewMode,
}: CategoryToolbarProps) => {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
      <p className="text-text-secondary text-sm font-medium">Найдено {productsTotal} товаров</p>

      <div className="flex max-w-full flex-wrap items-center gap-4">
        <AutoSubmitSelect
          action={ROUTES.CATEGORY(category.slug)}
          defaultValue={sort}
          hiddenFields={getCategoryHiddenFields({
            in_stock: inStock ? undefined : "false",
            has_discount: searchParams.has_discount,
            min_price: searchParams.min_price,
            max_price: searchParams.max_price,
            product_type: searchParams.product_type,
            limit: searchParams.limit,
            view: viewMode === "list" ? viewMode : undefined,
          })}
          label="Сортировать:"
          name="sort"
          options={sortOptions}
        />
        <ViewModeToggle
          gridHref={buildCategoryHref(category.slug, {
            ...searchParams,
            page: undefined,
            view: undefined,
          })}
          listHref={buildCategoryHref(category.slug, {
            ...searchParams,
            page: undefined,
            view: "list",
          })}
          viewMode={viewMode}
        />
      </div>
    </div>
  );
};

interface CategoryPaginationProps {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  slug: string;
  searchParams: CategorySearchParams;
}

const CategoryPagination = ({
  currentPage,
  pageSize,
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
        <AutoSubmitSelect
          action={ROUTES.CATEGORY(slug)}
          defaultValue={String(pageSize)}
          hiddenFields={getCategoryHiddenFields({
            in_stock: searchParams.in_stock,
            has_discount: searchParams.has_discount,
            min_price: searchParams.min_price,
            max_price: searchParams.max_price,
            product_type: searchParams.product_type,
            sort: searchParams.sort,
            view: searchParams.view,
          })}
          label="Показать по:"
          name="limit"
          options={pageSizeOptions}
        />
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
      scroll={false}
      href={buildCategoryHref(slug, { ...searchParams, page: String(page) })}
    >
      {children}
    </Link>
  );
};

const toPositiveNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.floor(parsed);
};

const toOptionalPrice = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return String(parsed);
};

const toPageSize = (value: string | undefined): number => {
  if (value === "48") return 48;
  if (value === "96") return 96;
  return 24;
};

const toCategorySort = (value: string | undefined): NonNullable<ProductListParams["sort"]> => {
  const option = sortOptions.find((item) => item.value === value);
  return option?.value ?? "popular";
};

const toViewMode = (value: ProductViewMode | undefined): ProductViewMode => {
  return value === "list" ? "list" : "grid";
};

const getCategoryHiddenFields = (
  params: Record<string, string | undefined>,
): Array<{ name: string; value: string }> => {
  return Object.entries(params).flatMap(([name, value]) => {
    return value ? [{ name, value }] : [];
  });
};

const getAccessToken = async (): Promise<string | undefined> => {
  const cookieStore = await cookies();
  return cookieStore.get("access_token")?.value;
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
