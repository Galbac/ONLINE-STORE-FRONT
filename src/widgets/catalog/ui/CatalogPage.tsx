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
import { productApi, type ProductListParams } from "@/entities/product";
import { CatalogCartButton, CatalogFavoriteButton } from "@/features/catalog-product-actions";
import { fallbackOnUnauthorized } from "@/shared/api";
import { cn, ROUTES } from "@/shared/config";
import { Button, Container, ProductCard } from "@/shared/ui";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";

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

const brandFilters = [
  ["Простоквашино", 24],
  ["Домик в деревне", 18],
  ["ВкусВилл", 31],
  ["Добрый", 22],
  ["Чудское озеро", 12],
] as const;

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
  const minPrice = searchParams.min_price;
  const maxPrice = searchParams.max_price ?? "1000";
  const sort = searchParams.sort ?? "popular";

  const productParams: ProductListParams = {
    page,
    limit: 24,
    in_stock: inStock,
    max_price: maxPrice,
    sort,
  };

  if (categoryId !== undefined) {
    productParams.category_id = categoryId;
  }

  if (minPrice !== undefined) {
    productParams.min_price = minPrice;
  }

  const [categoryTree, categories, products, cart, favorites] = await Promise.all([
    categoryApi.getTree(),
    categoryApi.getList(),
    productApi.getList(productParams),
    fallbackOnUnauthorized(cartApi.get(), emptyCartResponse),
    fallbackOnUnauthorized(favoriteApi.getList(), emptyFavoritesResponse),
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
              inStock={inStock}
              maxPrice={maxPrice}
              minPrice={minPrice}
            />
            <section>
              <CatalogToolbar
                selectedCategoryName={selectedCategory?.name}
                productsTotal={products.total}
                inStock={inStock}
                minPrice={minPrice}
                maxPrice={maxPrice}
                sort={sort}
              />

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
  inStock: boolean;
  minPrice?: string | undefined;
  maxPrice?: string | undefined;
}

const CatalogFilters = ({
  categories,
  currentCategoryId,
  inStock,
  maxPrice,
  minPrice,
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
                  href={buildCatalogHref({ category_id: String(category.id), page: undefined })}
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
            href={buildCatalogHref({ in_stock: inStock ? "false" : "true", page: undefined })}
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
        <form className="space-y-4" action={ROUTES.CATALOG}>
          <div className="grid grid-cols-2 gap-3">
            <input
              className="border-border focus:border-accent-primary h-12 min-w-0 rounded-lg border px-4 text-sm outline-none"
              name="min_price"
              placeholder="от 0"
              defaultValue={minPrice}
            />
            <input
              className="border-border focus:border-accent-primary h-12 min-w-0 rounded-lg border px-4 text-sm outline-none"
              name="max_price"
              placeholder="до 1000"
              defaultValue={maxPrice}
            />
          </div>
          <div className="bg-border relative h-1 rounded-full">
            <span className="bg-accent-primary absolute inset-y-0 left-0 w-full rounded-full" />
            <span className="border-accent-primary absolute top-1/2 left-0 size-5 -translate-y-1/2 rounded-full border-4 bg-white" />
            <span className="border-accent-primary absolute top-1/2 right-0 size-5 -translate-y-1/2 rounded-full border-4 bg-white" />
          </div>
          <div className="text-text-muted flex justify-between text-xs">
            <span>0</span>
            <span>500</span>
            <span>1000</span>
          </div>
          <Button className="h-10 w-full" type="submit">
            Применить
          </Button>
        </form>
      </FilterPanel>

      <FilterPanel title="Бренд">
        <div className="border-border text-text-muted mb-4 flex h-11 items-center rounded-lg border px-3 text-sm">
          Поиск бренда...
        </div>
        <ul className="space-y-3">
          {brandFilters.map(([brand, count]) => (
            <li className="flex items-center justify-between gap-3 text-sm" key={brand}>
              <label className="flex items-center gap-2">
                <span className="border-border size-4 rounded border" />
                {brand}
              </label>
              <span className="text-text-muted">{count}</span>
            </li>
          ))}
        </ul>
        <button className="text-accent-primary mt-4 text-sm font-semibold" type="button">
          Показать ещё
        </button>
      </FilterPanel>

      <FilterPanel title="Сортировка">
        <ul className="space-y-3 text-sm">
          {sortOptions.map((option) => (
            <li key={option.value}>
              <Link
                className="flex items-center gap-2"
                href={buildCatalogHref({ sort: option.value, page: undefined })}
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
  productsTotal: number;
  selectedCategoryName?: string | undefined;
  inStock: boolean;
  minPrice?: string | undefined;
  maxPrice?: string | undefined;
  sort: ProductListParams["sort"];
}

const CatalogToolbar = ({
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

const buildCatalogHref = (params: Record<string, string | undefined>): string => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      query.set(key, value);
    }
  });

  const queryString = query.toString();

  return queryString ? `${ROUTES.CATALOG}?${queryString}` : ROUTES.CATALOG;
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
