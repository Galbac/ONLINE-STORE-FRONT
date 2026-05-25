import { cookies } from "next/headers";
import Link from "next/link";
import { Grid2X2, List, RotateCcw, SearchX } from "lucide-react";
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
import { AutoSubmitSelect, Container, ProductCard } from "@/shared/ui";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";

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
  sort?: ProductSearchParams["sort"];
}

interface SearchUrlParams {
  q?: string | undefined;
  page?: string | undefined;
  limit?: string | undefined;
  category_id?: string | undefined;
  in_stock?: string | undefined;
  has_discount?: string | undefined;
  sort?: string | undefined;
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
  const sort = toSearchSort(searchParams.sort);
  const accessToken = await getAccessToken();

  const productParams: ProductSearchParams = {
    q: query,
    page,
    limit: pageSize,
    sort,
  };

  if (inStock) {
    productParams.in_stock = true;
  }

  if (categoryId !== undefined) {
    productParams.category_id = categoryId;
  }

  if (hasDiscount) {
    productParams.has_discount = true;
  }

  const [categories, products, cart, favorites] = await Promise.all([
    categoryApi.getList(),
    getSearchProducts(productParams, query, page, pageSize),
    fallbackOnUnauthorized(cartApi.get(), emptyCartResponse),
    fallbackOnUnauthorized(
      favoriteApi.getList({ page: 1, limit: 100 }, accessToken),
      emptyFavoritesResponse,
    ),
  ]);

  const visibleCategories = categories.items;
  const selectedCategory = visibleCategories.find((category) => category.id === categoryId);
  const favoriteProductIds = new Set(favorites.items.map((product) => product.id));
  const cartProductIds = new Set(cart.items.map((item) => item.product_id));

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
                <h1 className="text-text-primary text-4xl leading-tight font-bold">
                  Результаты поиска
                </h1>
                {query ? <FilterChip label={`«${query}»`} /> : null}
              </div>
              <p className="text-text-secondary mt-3 text-sm">
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
              currentParams={toSearchUrlParams(searchParams)}
              currentCategoryId={categoryId}
              hasDiscount={hasDiscount}
              inStock={inStock}
              query={query}
            />
            <section>
              <SearchToolbar
                currentCategoryId={categoryId}
                hasDiscount={hasDiscount}
                inStock={inStock}
                productsTotal={products.total}
                query={query}
                searchParams={searchParams}
                selectedCategoryName={selectedCategory?.name}
                sort={sort}
              />

              {products.items.length > 0 ? (
                <>
                  <div className="mt-5 grid grid-cols-2 gap-4 xl:grid-cols-4">
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

                  <SearchPagination
                    currentPage={products.page || page}
                    pageSize={pageSize}
                    searchParams={searchParams}
                    totalPages={products.pages}
                  />
                </>
              ) : (
                <SearchEmptyState query={query} />
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
  query: string;
}

const SearchFilters = ({
  categories,
  currentParams,
  currentCategoryId,
  hasDiscount,
  inStock,
  query,
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
                  ? "text-accent-primary"
                  : "text-text-primary hover:text-accent-primary",
              )}
              href={buildSearchHref({
                ...currentParams,
                category_id: undefined,
                page: undefined,
              })}
            >
              <span className="flex items-center gap-3">
                <span className="border-border size-4 rounded border" />
                Все результаты
              </span>
            </Link>
          </li>
          {categories.slice(0, 7).map((category) => (
            <li key={category.id}>
              <Link
                className={cn(
                  "flex items-center justify-between gap-3 rounded-md px-1 py-1.5 text-sm transition",
                  currentCategoryId === category.id
                    ? "text-accent-primary"
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
                <span className="text-text-muted">{category.products_count ?? 0}</span>
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

      <Link
        className="border-border text-text-secondary hover:bg-bg-hover flex h-12 items-center justify-center gap-2 rounded-lg border text-sm font-semibold transition"
        href={query ? `${ROUTES.SEARCH}?q=${encodeURIComponent(query)}` : ROUTES.SEARCH}
      >
        <RotateCcw size={16} />
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
}: SearchToolbarProps) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-text-secondary text-sm">
          Показано {productsTotal} {getProductCountLabel(productsTotal)}
        </span>
        {selectedCategoryName ? <FilterChip label={selectedCategoryName} /> : null}
        {inStock ? <FilterChip label="В наличии" /> : null}
        {hasDiscount ? <FilterChip label="Со скидкой" /> : null}
      </div>
      <div className="flex max-w-full flex-wrap items-center gap-4">
        <form
          className="border-border bg-bg-primary flex h-12 min-w-0 items-center gap-3 rounded-lg border px-4"
          action={ROUTES.SEARCH}
        >
          {query ? <input name="q" type="hidden" value={query} /> : null}
          {currentCategoryId ? (
            <input name="category_id" type="hidden" value={currentCategoryId} />
          ) : null}
          {!inStock ? <input name="in_stock" type="hidden" value="false" /> : null}
          {searchParams.limit ? (
            <input name="limit" type="hidden" value={searchParams.limit} />
          ) : null}
          {hasDiscount ? <input name="has_discount" type="hidden" value="true" /> : null}
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

interface FilterChipProps {
  label: string;
}

const FilterChip = ({ label }: FilterChipProps) => {
  return (
    <span className="border-accent-primary/25 bg-bg-hover text-accent-primary rounded-lg border px-4 py-2 text-sm font-semibold">
      {label}
    </span>
  );
};

interface SearchEmptyStateProps {
  query: string;
}

const SearchEmptyState = ({ query }: SearchEmptyStateProps) => {
  return (
    <div className="border-border mt-5 flex min-h-48 flex-col items-center justify-center rounded-lg border p-8 text-center md:flex-row md:text-left">
      <SearchX className="text-text-muted mb-4 md:mr-6 md:mb-0" size={72} />
      <div>
        <h2 className="text-xl font-bold">Ничего не найдено</h2>
        <p className="text-text-secondary mt-2 text-sm">
          {query
            ? "Попробуйте изменить запрос или выбрать другую категорию."
            : "Введите поисковый запрос или измените выбранные фильтры."}
        </p>
        <Link
          className="bg-accent-primary text-accent-contrast hover:bg-accent-hover mt-5 inline-flex h-12 items-center justify-center rounded-lg px-5 text-sm font-bold transition"
          href={ROUTES.SEARCH}
        >
          Сбросить фильтры
        </Link>
      </div>
    </div>
  );
};

interface SearchPaginationProps {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  searchParams: SearchPageParams;
}

const SearchPagination = ({
  currentPage,
  pageSize,
  searchParams,
  totalPages,
}: SearchPaginationProps) => {
  if (totalPages <= 1) {
    return null;
  }

  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, index) => index + 1);

  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <PageLink disabled={currentPage <= 1} page={currentPage - 1} searchParams={searchParams}>
          ‹
        </PageLink>
        {pages.map((page) => (
          <PageLink
            active={page === currentPage}
            key={page}
            page={page}
            searchParams={searchParams}
          >
            {page}
          </PageLink>
        ))}
        {totalPages > 6 ? <span className="text-text-muted px-2">...</span> : null}
        {totalPages > 5 ? (
          <PageLink page={totalPages} searchParams={searchParams}>
            {totalPages}
          </PageLink>
        ) : null}
        <PageLink
          disabled={currentPage >= totalPages}
          page={currentPage + 1}
          searchParams={searchParams}
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
            q: searchParams.q,
            sort: searchParams.sort,
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
  searchParams: SearchPageParams;
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
      href={buildSearchHref({ ...searchParams, page: String(page) })}
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

const toPageSize = (value: string | undefined): number => {
  const parsed = Number(value);

  return pageSizeOptions.some((option) => Number(option.value) === parsed) ? parsed : 24;
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

const toOptionalNumber = (value: string | undefined): number | undefined => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return undefined;
  }

  return parsed;
};

const toSearchSort = (
  value: ProductSearchParams["sort"] | undefined,
): NonNullable<ProductSearchParams["sort"]> => {
  const option = sortOptions.find((sortOption) => sortOption.value === value);

  return option?.value ?? "relevance";
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
  setSearchUrlParam(params, "page", searchParams.page);
  setSearchUrlParam(params, "q", searchParams.q);
  setSearchUrlParam(params, "sort", searchParams.sort);

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
  params: Partial<
    Pick<SearchUrlParams, "category_id" | "has_discount" | "in_stock" | "q" | "sort">
  >,
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
