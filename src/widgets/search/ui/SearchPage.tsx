import { cookies } from "next/headers";
import Link from "next/link";
import { RotateCcw, SearchX } from "lucide-react";
import { cartApi, emptyCartResponse } from "@/entities/cart";
import { categoryApi, type CategoryShortResponse } from "@/entities/category";
import { emptyFavoritesResponse, favoriteApi } from "@/entities/favorite";
import {
  productApi,
  type ProductSearchParams,
  type ProductSearchResponse,
} from "@/entities/product";
import { CatalogCartButton, CatalogFavoriteButton } from "@/features/catalog-product-actions";
import { ProductSearch } from "@/features/product-search";
import { fallbackOnUnauthorized, isApiErrorStatus } from "@/shared/api";
import { cn, ROUTES } from "@/shared/config";
import { AutoSubmitSelect, Container, ProductCard, ViewModeToggle } from "@/shared/ui";
import type { ProductViewMode } from "@/shared/ui";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";
import { CatalogPriceFilter } from "@/widgets/catalog/ui/CatalogPriceFilter";
import { ProductTypeFilter } from "@/widgets/catalog/ui/ProductTypeFilter";
import { DietaryFilter } from "@/widgets/catalog/ui/DietaryFilter";
import { QuickFilterChips } from "@/widgets/catalog/ui/QuickFilterChips";

interface SearchPageProps {
  searchParams: SearchPageParams;
}

interface SearchPageParams {
  q?: string;
  page?: string;
  limit?: string;
  category_id?: string;
  in_stock?: string;
  has_discount?: string;
  min_price?: string;
  max_price?: string;
  product_type?: "piece" | "weight";
  tag?: string;
  sort?: ProductSearchParams["sort"];
  view?: ProductViewMode;
}

interface SearchUrlParams {
  q?: string | undefined;
  page?: string | undefined;
  limit?: string | undefined;
  category_id?: string | undefined;
  in_stock?: string | undefined;
  has_discount?: string | undefined;
  min_price?: string | undefined;
  max_price?: string | undefined;
  product_type?: string | undefined;
  tag?: string | undefined;
  sort?: string | undefined;
  view?: string | undefined;
}

const sortOptions: Array<{ label: string; value: NonNullable<ProductSearchParams["sort"]> }> = [
  { label: "По релевантности", value: "relevance" },
  { label: "По популярности", value: "popular" },
  { label: "Сначала новинки", value: "newest" },
  { label: "По цене: по возрастанию", value: "price_asc" },
  { label: "По цене: по убыванию", value: "price_desc" },
];

const pageSizeOptions = [
  { label: "24", value: "24" },
  { label: "48", value: "48" },
  { label: "96", value: "96" },
] as const;

const getEmptySearchResponse = (
  query: string,
  page: number,
  limit: number,
): ProductSearchResponse => ({
  query,
  items: [],
  total: 0,
  page,
  limit,
  pages: 0,
});

export const SearchPage = async ({ searchParams }: SearchPageProps) => {
  const query = searchParams.q?.trim() ?? "";
  const page = toPositiveNumber(searchParams.page, 1);
  const pageSize = toPageSize(searchParams.limit);
  const categoryId = toOptionalNumber(searchParams.category_id);
  const inStock = searchParams.in_stock !== "false";
  const hasDiscount = searchParams.has_discount === "true";
  const minPrice = toOptionalPrice(searchParams.min_price);
  const maxPrice = toOptionalPrice(searchParams.max_price);
  const productType =
    searchParams.product_type === "piece" || searchParams.product_type === "weight"
      ? searchParams.product_type
      : undefined;
  const tag = searchParams.tag?.trim() || undefined;
  const sort = toSearchSort(searchParams.sort);
  const viewMode = toViewMode(searchParams.view);
  const accessToken = await getAccessToken();

  const searchPayload: ProductSearchParams = {
    limit: pageSize,
    page,
    q: query,
    sort,
  };
  if (categoryId !== undefined) {
    searchPayload.category_id = categoryId;
  }

  if (inStock) {
    searchPayload.in_stock = true;
  }
  if (hasDiscount) {
    searchPayload.has_discount = true;
  }
  if (minPrice !== undefined) {
    searchPayload.min_price = minPrice;
  }
  if (maxPrice !== undefined) {
    searchPayload.max_price = maxPrice;
  }
  if (productType !== undefined) {
    searchPayload.product_type = productType;
  }
  if (tag !== undefined) {
    searchPayload.tag = tag;
  }

  const [categoryListResponse, products, cart, favorites] = await Promise.all([
    categoryApi.getList(),
    getSearchProducts(searchPayload, query, page, pageSize),
    fallbackOnUnauthorized(cartApi.get(), emptyCartResponse),
    fallbackOnUnauthorized(
      favoriteApi.getList({ page: 1, limit: 100 }, accessToken),
      emptyFavoritesResponse,
    ),
  ]);

  const prices = products.items.map((item) => Number(item.price)).filter(Number.isFinite);
  const maxSearchPrice = Math.max(100, ...prices, Number(maxPrice || 0));
  const sliderMax = Math.ceil(maxSearchPrice / 100) * 100;

  const favoriteProductIds = new Set(favorites.items.map((product) => product.id));
  const cartProductIds = new Set(cart.items.map((item) => item.product_id));
  const categories = categoryListResponse.items;
  const selectedCategory = categories.find((category) => category.id === categoryId);
  const visibleCategories = getVisibleCategories(categories, selectedCategory);
  const urlParams = toSearchUrlParams(searchParams);

  return (
    <>
      <Header />
      <main>
        <Container className="py-6">
          <nav className="text-text-secondary mb-5 flex items-center gap-2 text-sm">
            <Link className="hover:text-accent-primary" href={ROUTES.HOME}>
              Главная
            </Link>
            <span>/</span>
            <span>Поиск</span>
          </nav>

          <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-text-primary text-3xl md:text-4xl leading-tight font-bold">
                  Результаты поиска
                </h1>
                {query ? <FilterChip label={`«${query}»`} /> : null}
              </div>
              <p className="text-text-secondary mt-2 text-sm">
                Найдено {products.total} {getProductCountLabel(products.total)}
              </p>
            </div>
            <div className="w-full lg:max-w-xl">
              <ProductSearch defaultValue={query} />
            </div>
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
            <SearchFilters
              categories={visibleCategories}
              currentParams={urlParams}
              currentCategoryId={categoryId}
              hasDiscount={hasDiscount}
              inStock={inStock}
              maxPrice={maxPrice}
              minPrice={minPrice}
              productType={productType}
              query={query}
              sliderMax={sliderMax}
            />

            <section className="min-w-0">
              <SearchToolbar
                currentCategoryId={categoryId}
                hasDiscount={hasDiscount}
                inStock={inStock}
                productsTotal={products.total}
                query={query}
                searchParams={searchParams}
                selectedCategoryName={selectedCategory?.name}
                sort={sort}
                viewMode={viewMode}
              />

              <div className="my-6">
              <QuickFilterChips
                chips={[
                  {
                    id: "all",
                    label: "Все результаты",
                    active: !hasDiscount && !productType && inStock && sort === "relevance",
                    href: buildSearchHref({ ...urlParams, has_discount: undefined, product_type: undefined, in_stock: undefined, sort: undefined, page: undefined }),
                  },
                  {
                    id: "discount",
                    label: "🔥 Скидки",
                    active: hasDiscount,
                    href: buildSearchHref({ ...urlParams, has_discount: hasDiscount ? undefined : "true", page: undefined }),
                  },
                  {
                    id: "popular",
                    label: "⭐ Популярное",
                    active: sort === "popular",
                    href: buildSearchHref({ ...urlParams, sort: "popular", page: undefined }),
                  },
                  {
                    id: "newest",
                    label: "🆕 Новинки",
                    active: sort === "newest",
                    href: buildSearchHref({ ...urlParams, sort: "newest", page: undefined }),
                  },
                  {
                    id: "weight",
                    label: "⚖️ На развес",
                    active: productType === "weight",
                    href: buildSearchHref({ ...urlParams, product_type: productType === "weight" ? undefined : "weight", page: undefined }),
                  },
                  {
                    id: "piece",
                    label: "📦 Штучные",
                    active: productType === "piece",
                    href: buildSearchHref({ ...urlParams, product_type: productType === "piece" ? undefined : "piece", page: undefined }),
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
                      viewMode === "grid" ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-4" : "grid-cols-1",
                    )}
                  >
                    {products.items.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        variant={viewMode}
                        initialInCart={cartProductIds.has(product.id)}
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
                      />
                    ))}
                  </div>

                  <SearchPagination
                    currentPage={page}
                    pageSize={pageSize}
                    searchParams={searchParams}
                    totalPages={products.pages}
                  />
                </>
              ) : (
                <EmptySearchState query={query} />
              )}
            </section>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
};

interface SearchFiltersProps {
  categories: CategoryShortResponse[];
  currentParams: SearchUrlParams;
  currentCategoryId?: number | undefined;
  hasDiscount: boolean;
  inStock: boolean;
  maxPrice?: string | undefined;
  minPrice?: string | undefined;
  productType?: string | undefined;
  query: string;
  sliderMax: number;
}

const SearchFilters = ({
  categories,
  currentCategoryId,
  currentParams,
  hasDiscount,
  inStock,
  maxPrice,
  minPrice,
  productType,
  query,
  sliderMax,
}: SearchFiltersProps) => {
  return (
    <aside className="min-w-0 space-y-4">
      <FilterPanel title="Категории">
        <ul className="space-y-3">
          <li>
            <Link
              className={cn(
                "flex items-center justify-between gap-3 rounded-md px-1 py-1.5 text-sm transition",
                currentCategoryId === undefined
                  ? "text-accent-primary font-bold"
                  : "text-text-primary hover:text-accent-primary",
              )}
              href={buildSearchHref({
                ...currentParams,
                category_id: undefined,
                page: undefined,
              })}
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="border-border size-4 shrink-0 rounded border" />
                <span className="truncate">Все категории</span>
              </span>
            </Link>
          </li>
          {categories.slice(0, 7).map((category) => (
            <li key={category.id}>
              <Link
                className={cn(
                  "flex items-center justify-between gap-3 rounded-md px-1 py-1.5 text-sm transition",
                  currentCategoryId === category.id
                    ? "text-accent-primary font-bold"
                    : "text-text-primary hover:text-accent-primary",
                )}
                href={buildSearchHref({
                  ...currentParams,
                  category_id: String(category.id),
                  page: undefined,
                })}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="border-border size-4 shrink-0 rounded border" />
                  <span className="truncate">{category.name}</span>
                </span>
                <span className="text-text-muted text-xs">{category.products_count ?? 0}</span>
              </Link>
            </li>
          ))}
        </ul>
      </FilterPanel>

      <FilterPanel>
        <ToggleFilter
          active={inStock}
          href={buildSearchHref({
            ...currentParams,
            in_stock: inStock ? "false" : "true",
            page: undefined,
          })}
          label="Только в наличии"
        />
      </FilterPanel>

      <FilterPanel>
        <ToggleFilter
          active={hasDiscount}
          href={buildSearchHref({
            ...currentParams,
            has_discount: hasDiscount ? undefined : "true",
            page: undefined,
          })}
          label="Со скидкой"
        />
      </FilterPanel>

      <FilterPanel title="Диета и состав">
        <DietaryFilter
          currentTag={currentParams.tag}
          buildHref={(t) =>
            buildSearchHref({
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
            buildSearchHref({
              ...currentParams,
              product_type: type,
              page: undefined,
            })
          }
        />
      </FilterPanel>

      <FilterPanel title="Цена, ₽">
        <CatalogPriceFilter
          action={ROUTES.SEARCH}
          currentParams={currentParams as Record<string, string | undefined>}
          maxPrice={maxPrice}
          minPrice={minPrice}
          resetHref={buildSearchHref({
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
        href={query ? `${ROUTES.SEARCH}?q=${encodeURIComponent(query)}` : ROUTES.SEARCH}
      >
        <RotateCcw size={14} />
        Сбросить фильтры
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

interface ToggleFilterProps {
  active: boolean;
  href: string;
  label: string;
}

const ToggleFilter = ({ active, href, label }: ToggleFilterProps) => {
  return (
    <Link className="flex items-center justify-between gap-4" href={href}>
      <span className="text-sm font-bold">{label}</span>
      <span
        className={cn(
          "relative h-8 w-14 shrink-0 rounded-full transition",
          active ? "bg-accent-primary" : "bg-border",
        )}
      >
        <span
          className={cn(
            "absolute top-1 grid size-6 place-items-center rounded-full bg-white transition",
            active ? "right-1" : "left-1",
          )}
        />
      </span>
    </Link>
  );
};

interface SearchToolbarProps {
  productsTotal: number;
  query: string;
  currentCategoryId?: number | undefined;
  selectedCategoryName?: string | undefined;
  hasDiscount: boolean;
  inStock: boolean;
  searchParams: SearchPageParams;
  sort: ProductSearchParams["sort"];
  viewMode: ProductViewMode;
}

const SearchToolbar = ({
  currentCategoryId,
  hasDiscount,
  inStock,
  productsTotal,
  query,
  searchParams,
  selectedCategoryName,
  sort,
  viewMode,
}: SearchToolbarProps) => {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-text-secondary text-sm font-medium">
          Показано {productsTotal} {getProductCountLabel(productsTotal)}
        </span>
        {selectedCategoryName ? <FilterChip label={selectedCategoryName} /> : null}
        {inStock ? <FilterChip label="В наличии" /> : null}
        {hasDiscount ? <FilterChip label="Со скидкой" /> : null}
      </div>
      <div className="flex max-w-full flex-wrap items-center gap-4">
        <AutoSubmitSelect
          action={ROUTES.SEARCH}
          defaultValue={sort ?? "relevance"}
          hiddenFields={getSearchHiddenFields({
            category_id: currentCategoryId ? String(currentCategoryId) : undefined,
            has_discount: hasDiscount ? "true" : undefined,
            in_stock: inStock ? undefined : "false",
            min_price: searchParams.min_price,
            max_price: searchParams.max_price,
            product_type: searchParams.product_type,
            q: query,
            view: viewMode === "list" ? viewMode : undefined,
          })}
          label="Сортировать:"
          name="sort"
          options={sortOptions}
        />
        <ViewModeToggle
          gridHref={buildSearchHref({ ...toSearchUrlParams(searchParams), page: undefined, view: undefined })}
          listHref={buildSearchHref({ ...toSearchUrlParams(searchParams), page: undefined, view: "list" })}
          viewMode={viewMode}
        />
      </div>
    </div>
  );
};

interface FilterChipProps {
  label?: string | undefined;
}

const FilterChip = ({ label }: FilterChipProps) => {
  if (!label) return null;
  return (
    <span className="border-accent-primary/25 bg-bg-hover text-accent-primary rounded-lg border px-3 py-1 text-xs font-semibold">
      {label}
    </span>
  );
};

const EmptySearchState = ({ query }: { query: string }) => {
  return (
    <div className="border-border rounded-lg border bg-white p-10 text-center shadow-xs">
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
        <SearchX size={28} />
      </div>
      <h3 className="mt-4 text-xl font-bold text-slate-800">
        {query ? `Ничего не найдено по запросу «${query}»` : "Начните поиск товаров"}
      </h3>
      <p className="mt-2 text-xs text-slate-500 max-w-md mx-auto">
        Проверьте правильность написания или попробуйте изменить параметры фильтрации.
      </p>
      <Link
        href={ROUTES.CATALOG}
        className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-6 text-xs font-bold text-white transition hover:bg-emerald-700 shadow-xs"
      >
        Перейти в каталог
      </Link>
    </div>
  );
};

interface SearchPaginationProps {
  currentPage: number;
  pageSize: number;
  searchParams: SearchPageParams;
  totalPages: number;
}

const SearchPagination = ({
  currentPage,
  pageSize,
  searchParams,
  totalPages,
}: SearchPaginationProps) => {
  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, index) => index + 1);
  const currentParams = toSearchUrlParams(searchParams);

  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <PageLink disabled={currentPage <= 1} page={currentPage - 1} searchParams={currentParams}>
          ‹
        </PageLink>
        {pages.map((page) => (
          <PageLink active={page === currentPage} key={page} page={page} searchParams={currentParams}>
            {page}
          </PageLink>
        ))}
        {totalPages > 6 ? <span className="text-text-muted px-2">...</span> : null}
        {totalPages > 5 ? (
          <PageLink page={totalPages} searchParams={currentParams}>
            {totalPages}
          </PageLink>
        ) : null}
        <PageLink
          disabled={currentPage >= totalPages}
          page={currentPage + 1}
          searchParams={currentParams}
        >
          ›
        </PageLink>
      </div>
      <div className="text-text-secondary flex items-center gap-3 text-sm">
        <AutoSubmitSelect
          action={ROUTES.SEARCH}
          defaultValue={String(pageSize)}
          hiddenFields={getSearchHiddenFields({
            category_id: searchParams.category_id,
            has_discount: searchParams.has_discount,
            in_stock: searchParams.in_stock,
            min_price: searchParams.min_price,
            max_price: searchParams.max_price,
            product_type: searchParams.product_type,
            q: searchParams.q,
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
  searchParams: SearchUrlParams;
  children: React.ReactNode;
}

const PageLink = ({ active, children, disabled, page, searchParams }: PageLinkProps) => {
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
      href={buildSearchHref({ ...searchParams, page: String(page) })}
    >
      {children}
    </Link>
  );
};

const getVisibleCategories = (
  categories: CategoryShortResponse[],
  selectedCategory?: CategoryShortResponse | undefined,
): CategoryShortResponse[] => {
  if (!selectedCategory) {
    return categories;
  }
  const hasSelectedCategory = categories.some((category) => category.id === selectedCategory.id);
  if (hasSelectedCategory) {
    return categories;
  }
  return [selectedCategory, ...categories];
};

const getSearchProducts = async (
  params: ProductSearchParams,
  query: string,
  page: number,
  limit: number,
): Promise<ProductSearchResponse> => {
  if (!query) {
    return getEmptySearchResponse(query, page, limit);
  }
  try {
    return await productApi.search(params);
  } catch (error) {
    if (isApiErrorStatus(error, 400) || isApiErrorStatus(error, 404)) {
      return getEmptySearchResponse(query, page, limit);
    }
    throw error;
  }
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

const toOptionalNumber = (value: string | undefined): number | undefined => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return undefined;
  }
  return parsed;
};

const toPageSize = (value: string | undefined): number => {
  if (value === "48") return 48;
  if (value === "96") return 96;
  return 24;
};

const toSearchSort = (
  value: ProductSearchParams["sort"] | undefined,
): NonNullable<ProductSearchParams["sort"]> => {
  const option = sortOptions.find((sortOption) => sortOption.value === value);
  return option?.value ?? "relevance";
};

const toViewMode = (value: ProductViewMode | undefined): ProductViewMode => {
  return value === "list" ? "list" : "grid";
};

const getAccessToken = async (): Promise<string | undefined> => {
  const cookieStore = await cookies();
  return cookieStore.get("access_token")?.value;
};

const toSearchUrlParams = (searchParams: SearchPageParams): SearchUrlParams => {
  const params: SearchUrlParams = {};
  setSearchUrlParam(params, "category_id", searchParams.category_id);
  setSearchUrlParam(params, "has_discount", searchParams.has_discount);
  setSearchUrlParam(params, "in_stock", searchParams.in_stock);
  setSearchUrlParam(params, "limit", searchParams.limit);
  setSearchUrlParam(params, "max_price", searchParams.max_price);
  setSearchUrlParam(params, "min_price", searchParams.min_price);
  setSearchUrlParam(params, "product_type", searchParams.product_type);
  setSearchUrlParam(params, "tag", searchParams.tag);
  setSearchUrlParam(params, "page", searchParams.page);
  setSearchUrlParam(params, "q", searchParams.q);
  setSearchUrlParam(params, "sort", searchParams.sort);
  setSearchUrlParam(params, "view", searchParams.view);
  return params;
};

const setSearchUrlParam = (
  params: SearchUrlParams,
  key: keyof SearchUrlParams,
  value: string | undefined,
): void => {
  if (value) {
    params[key] = value;
  }
};

const buildSearchHref = (params: SearchUrlParams): string => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      query.set(key, value);
    }
  });
  const queryString = query.toString();
  return queryString ? `${ROUTES.SEARCH}?${queryString}` : ROUTES.SEARCH;
};

const getSearchHiddenFields = (
  params: Record<string, string | undefined>,
): Array<{ name: string; value: string }> => {
  return Object.entries(params).flatMap(([name, value]) => {
    return value ? [{ name, value }] : [];
  });
};

const getProductCountLabel = (count: number): string => {
  const lastTwoDigits = count % 100;
  const lastDigit = count % 10;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return "товаров";
  }
  if (lastDigit === 1) {
    return "товар";
  }
  if (lastDigit >= 2 && lastDigit <= 4) {
    return "товара";
  }
  return "товаров";
};
