import Link from "next/link";
import {
  Apple,
  Beef,
  Cookie,
  Grid2X2,
  Leaf,
  List,
  Milk,
  Package,
  RotateCcw,
  SprayCan,
  Wheat,
} from "lucide-react";
import { cartApi, emptyCartResponse } from "@/entities/cart";
import { categoryApi, type CategoryShortResponse } from "@/entities/category";
import { emptyFavoritesResponse, favoriteApi } from "@/entities/favorite";
import { productApi, type ProductListParams, type ProductListResponse } from "@/entities/product";
import { CatalogCartButton, CatalogFavoriteButton } from "@/features/catalog-product-actions";
import { fallbackOnUnauthorized, isApiErrorStatus } from "@/shared/api";
import { cn, ROUTES } from "@/shared/config";
import { Container, ProductCard } from "@/shared/ui";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";
import { buildCatalogHref, type CatalogUrlParams } from "../lib/catalogUrl";
import { CatalogPriceFilter } from "./CatalogPriceFilter";

interface CatalogPageProps {
  searchParams: CatalogSearchParams;
}

interface CatalogSearchParams {
  page?: string;
  category_id?: string;
  in_stock?: string;
  min_price?: string;
  max_price?: string;
  sort?: ProductListParams["sort"];
}

const sortOptions: Array<{ label: string; value: NonNullable<ProductListParams["sort"]> }> = [
  { label: "По популярности", value: "popular" },
  { label: "Сначала новинки", value: "newest" },
  { label: "По цене: по возрастанию", value: "price_asc" },
  { label: "По цене: по убыванию", value: "price_desc" },
  { label: "По названию", value: "name_asc" },
];

export const CatalogPage = async ({ searchParams }: CatalogPageProps) => {
  const page = toPositiveNumber(searchParams.page, 1);
  const categoryId = toOptionalNumber(searchParams.category_id);
  const inStock = searchParams.in_stock !== "false";
  const minPrice = toOptionalPrice(searchParams.min_price);
  const maxPrice = toOptionalPrice(searchParams.max_price);
  const sort = toCatalogSort(searchParams.sort);

  const productParams: ProductListParams = {
    page,
    limit: 24,
    in_stock: inStock,
    sort,
  };

  if (maxPrice !== undefined) {
    productParams.max_price = maxPrice;
  }

  if (categoryId !== undefined) {
    productParams.category_id = categoryId;
  }

  if (minPrice !== undefined) {
    productParams.min_price = minPrice;
  }

  const priceBoundsParams: ProductListParams = {
    limit: 1,
    page: 1,
    in_stock: inStock,
    sort: "price_desc",
  };

  if (categoryId !== undefined) {
    priceBoundsParams.category_id = categoryId;
  }

  const [categoryTree, categories, products, cart, favorites, priceBounds] = await Promise.all([
    categoryApi.getTree(),
    categoryApi.getList(),
    getCatalogProducts(productParams, page),
    fallbackOnUnauthorized(cartApi.get(), emptyCartResponse),
    fallbackOnUnauthorized(favoriteApi.getList(), emptyFavoritesResponse),
    getCatalogProducts(priceBoundsParams, 1),
  ]);

  const visibleCategories = categories.items.length > 0 ? categories.items : categoryTree.items;
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
            <span>Каталог</span>
          </nav>

          <h1 className="text-text-primary mb-8 text-4xl font-bold">Каталог товаров</h1>

          <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[330px_minmax(0,1fr)]">
            <CatalogFilters
              categories={visibleCategories}
              currentCategoryId={categoryId}
              currentParams={toCatalogUrlParams(searchParams)}
              inStock={inStock}
              maxPrice={maxPrice}
              minPrice={minPrice}
              sliderMax={getPriceSliderMax(priceBounds.items, minPrice, maxPrice)}
            />
            <section>
              <CatalogToolbar
                currentParams={toCatalogUrlParams(searchParams)}
                selectedCategoryName={selectedCategory?.name}
                productsTotal={products.total}
                inStock={inStock}
                minPrice={minPrice}
                maxPrice={maxPrice}
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

                  <CatalogPagination
                    currentPage={products.page || page}
                    totalPages={products.pages}
                    searchParams={searchParams}
                  />
                </>
              ) : (
                <CatalogEmptyState />
              )}
            </section>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
};

interface CatalogFiltersProps {
  categories: CategoryShortResponse[];
  currentCategoryId?: number | undefined;
  currentParams: CatalogUrlParams;
  inStock: boolean;
  minPrice?: string | undefined;
  maxPrice?: string | undefined;
  sliderMax: number;
}

const CatalogFilters = ({
  categories,
  currentCategoryId,
  currentParams,
  inStock,
  maxPrice,
  minPrice,
  sliderMax,
}: CatalogFiltersProps) => {
  return (
    <aside className="min-w-0 space-y-4">
      <FilterPanel title="Категории">
        <ul className="space-y-3">
          {categories.slice(0, 8).map((category) => {
            const Icon = getCategoryIcon(category.name);

            return (
              <li key={category.id}>
                <Link
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-md px-1 py-1.5 text-sm transition",
                    currentCategoryId === category.id
                      ? "text-accent-primary"
                      : "text-text-primary hover:text-accent-primary",
                  )}
                  href={buildCatalogHref({
                    ...currentParams,
                    category_id: String(category.id),
                    page: undefined,
                  })}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Icon className="shrink-0" size={18} />
                    <span className="truncate">{category.name}</span>
                  </span>
                  <span className="text-text-muted">{category.products_count ?? 0}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </FilterPanel>

      <FilterPanel>
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-sm font-bold">Только в наличии</h2>
            <p className="text-text-muted mt-2 text-xs leading-5">
              Показывать товары, которые есть в наличии
            </p>
          </div>
          <Link
            className={cn(
              "relative h-8 w-14 shrink-0 rounded-full transition",
              inStock ? "bg-accent-primary" : "bg-border",
            )}
            href={buildCatalogHref({
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

      <FilterPanel title="Цена, ₽">
        <CatalogPriceFilter
          currentParams={currentParams}
          maxPrice={maxPrice}
          minPrice={minPrice}
          sliderMax={sliderMax}
        />
      </FilterPanel>

      <FilterPanel title="Сортировка">
        <ul className="space-y-3 text-sm">
          {sortOptions.map((option) => (
            <li key={option.value}>
              <Link
                className="flex items-center gap-2"
                href={buildCatalogHref({ ...currentParams, sort: option.value, page: undefined })}
              >
                <span
                  className={cn(
                    "grid size-4 place-items-center rounded-full border",
                    option.value === "popular" ? "border-accent-primary" : "border-text-muted",
                  )}
                >
                  {option.value === "popular" ? (
                    <span className="bg-accent-primary size-2 rounded-full" />
                  ) : null}
                </span>
                {option.label}
              </Link>
            </li>
          ))}
        </ul>
      </FilterPanel>

      <Link
        className="border-border text-text-secondary hover:bg-bg-hover flex h-12 items-center justify-center gap-2 rounded-lg border text-sm font-semibold transition"
        href={ROUTES.CATALOG}
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

interface CatalogToolbarProps {
  currentParams: CatalogUrlParams;
  productsTotal: number;
  selectedCategoryName?: string | undefined;
  inStock: boolean;
  minPrice?: string | undefined;
  maxPrice?: string | undefined;
  sort: ProductListParams["sort"];
}

const CatalogToolbar = ({
  currentParams,
  inStock,
  maxPrice,
  minPrice,
  productsTotal,
  selectedCategoryName,
  sort,
}: CatalogToolbarProps) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-text-secondary text-sm">Найдено {productsTotal} товара</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedCategoryName ? <FilterChip label={selectedCategoryName} /> : null}
            {inStock ? <FilterChip label="В наличии" /> : null}
            {maxPrice ? <FilterChip label={`Цена: до ${maxPrice} ₽`} /> : null}
            {minPrice ? <FilterChip label={`Цена: от ${minPrice} ₽`} /> : null}
            <Link
              className="text-accent-primary px-2 py-2 text-sm font-semibold"
              href={ROUTES.CATALOG}
            >
              Сбросить все
            </Link>
          </div>
        </div>
        <div className="flex max-w-full flex-wrap items-center gap-4">
          <form
            className="border-border bg-bg-primary flex h-12 min-w-0 items-center gap-3 rounded-lg border px-4"
            action={ROUTES.CATALOG}
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
            {currentParams.category_id ? (
              <input name="category_id" type="hidden" value={currentParams.category_id} />
            ) : null}
            {currentParams.in_stock ? (
              <input name="in_stock" type="hidden" value={currentParams.in_stock} />
            ) : null}
            {minPrice ? <input name="min_price" type="hidden" value={minPrice} /> : null}
            {maxPrice ? <input name="max_price" type="hidden" value={maxPrice} /> : null}
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

const CatalogEmptyState = () => {
  return (
    <div className="border-border mt-5 rounded-lg border p-8 text-center">
      <h2 className="text-text-primary text-xl font-bold">Товары не найдены</h2>
      <p className="text-text-secondary mt-3 text-sm">
        Измените фильтры или сбросьте параметры каталога.
      </p>
      <Link
        className="bg-accent-primary text-accent-contrast hover:bg-accent-hover mt-5 inline-flex h-12 items-center justify-center rounded-lg px-5 text-sm font-bold transition"
        href={ROUTES.CATALOG}
      >
        Сбросить фильтры
      </Link>
    </div>
  );
};

interface CatalogPaginationProps {
  currentPage: number;
  totalPages: number;
  searchParams: CatalogSearchParams;
}

const CatalogPagination = ({ currentPage, searchParams, totalPages }: CatalogPaginationProps) => {
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
  searchParams: CatalogSearchParams;
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
      href={buildCatalogHref({ ...searchParams, page: String(page) })}
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

const toOptionalNumber = (value: string | undefined): number | undefined => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return undefined;
  }

  return parsed;
};

const toOptionalPrice = (value: string | undefined): string | undefined => {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return undefined;
  }

  const parsed = Number(normalizedValue);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return undefined;
  }

  return normalizedValue;
};

const toCatalogSort = (
  value: ProductListParams["sort"] | undefined,
): NonNullable<ProductListParams["sort"]> => {
  const option = sortOptions.find((sortOption) => sortOption.value === value);

  return option?.value ?? "popular";
};

const getEmptyProductListResponse = (page: number): ProductListResponse => ({
  items: [],
  total: 0,
  page,
  limit: 24,
  pages: 0,
});

const getCatalogProducts = async (
  params: ProductListParams,
  page: number,
): Promise<ProductListResponse> => {
  try {
    return await productApi.getList(params);
  } catch (error) {
    if (isApiErrorStatus(error, 400) || isApiErrorStatus(error, 404)) {
      return getEmptyProductListResponse(page);
    }

    throw error;
  }
};

const getCategoryIcon = (categoryName: string): typeof Apple => {
  if (categoryName.includes("Фрукты")) return Apple;
  if (categoryName.includes("Овощи")) return Leaf;
  if (categoryName.includes("Молоко")) return Milk;
  if (categoryName.includes("Мясо")) return Beef;
  if (categoryName.includes("Хлеб")) return Wheat;
  if (categoryName.includes("Напитки")) return Cookie;
  if (categoryName.includes("Бакалея")) return Package;
  if (categoryName.includes("химия")) return SprayCan;

  return Package;
};

const toCatalogUrlParams = (searchParams: CatalogSearchParams): CatalogUrlParams => {
  const params: CatalogUrlParams = {};

  setCatalogUrlParam(params, "category_id", searchParams.category_id);
  setCatalogUrlParam(params, "in_stock", searchParams.in_stock);
  setCatalogUrlParam(params, "max_price", searchParams.max_price);
  setCatalogUrlParam(params, "min_price", searchParams.min_price);
  setCatalogUrlParam(params, "page", searchParams.page);
  setCatalogUrlParam(params, "sort", searchParams.sort);

  return params;
};

const setCatalogUrlParam = (
  params: CatalogUrlParams,
  key: keyof CatalogUrlParams,
  value: string | undefined,
): void => {
  if (value) {
    params[key] = value;
  }
};

const getPriceSliderMax = (
  products: ProductListResponse["items"],
  minPrice: string | undefined,
  maxPrice: string | undefined,
): number => {
  const prices = products.map((product) => Number(product.price)).filter(Number.isFinite);
  const selectedPrices = [Number(minPrice), Number(maxPrice)].filter(Number.isFinite);
  const maxProductPrice = Math.max(100, ...prices, ...selectedPrices);

  return Math.ceil(maxProductPrice / 100) * 100;
};
