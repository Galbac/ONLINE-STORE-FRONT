import { cookies } from "next/headers";
import Link from "next/link";
import { Package } from "lucide-react";
import { cartApi, emptyCartResponse } from "@/entities/cart";
import { categoryApi } from "@/entities/category";
import { emptyFavoritesResponse, favoriteApi } from "@/entities/favorite";
import { productApi, type ProductListParams, type ProductListResponse } from "@/entities/product";
import { fallbackOnUnauthorized, isApiErrorStatus } from "@/shared/api";
import { ROUTES } from "@/shared/config";
import { AutoSubmitSelect, Container, ViewModeToggle } from "@/shared/ui";
import type { ProductViewMode } from "@/shared/ui";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";
import { CatalogControls } from "@/components/catalog/CatalogControls";
import { CatalogSidebar } from "@/components/catalog/CatalogSidebar";
import { formatFoundProducts } from "@/utils/pluralize";
import { buildCatalogHref, type CatalogUrlParams } from "../lib/catalogUrl";
import { QuickFilterChips } from "./QuickFilterChips";
import { CatalogProductFeed } from "./CatalogProductFeed";

interface CatalogPageProps {
  searchParams: CatalogSearchParams;
}

interface CatalogSearchParams {
  page?: string;
  limit?: string;
  category_id?: string;
  article?: string;
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

export const CatalogPage = async ({ searchParams }: CatalogPageProps) => {
  const page = toPositiveNumber(searchParams.page, 1);
  const pageSize = toPageSize(searchParams.limit);
  const categoryId = toOptionalNumber(searchParams.category_id);
  const hasDiscount = searchParams.has_discount === "true";
  const minPrice = toOptionalPrice(searchParams.min_price);
  const maxPrice = toOptionalPrice(searchParams.max_price);
  const productType = searchParams.product_type === "piece" || searchParams.product_type === "weight" ? searchParams.product_type : undefined;
  const tag = searchParams.tag?.trim() || undefined;
  const sort = toCatalogSort(searchParams.sort);
  const viewMode = toViewMode(searchParams.view);
  const accessToken = await getAccessToken();
  const storeId = await getSelectedStoreId();

  const productParams: ProductListParams = {
    page,
    limit: pageSize,
    sort,
    in_stock: true,
    ...(storeId !== undefined ? { store_id: storeId } : {}),
  };

  if (maxPrice !== undefined) {
    productParams.max_price = maxPrice;
  }

  if (categoryId !== undefined) {
    productParams.category_id = categoryId;
  }

  if (hasDiscount) {
    productParams.has_discount = true;
  }

  if (minPrice !== undefined) {
    productParams.min_price = minPrice;
  }

  if (productType !== undefined) {
    productParams.product_type = productType;
  }
  if (tag !== undefined) {
    productParams.tag = tag;
  }
  const article = searchParams.article?.trim() || undefined;
  if (article !== undefined) {
    productParams.article = article;
  }

  // Запрос реальной максимальной цены в базе данных среди доступных товаров (сортировка по убыванию цены)
  const priceBoundsParams: ProductListParams = {
    limit: 1,
    page: 1,
    sort: "price_desc",
    in_stock: true,
    ...(storeId !== undefined ? { store_id: storeId } : {}),
  };

  if (categoryId !== undefined) {
    priceBoundsParams.category_id = categoryId;
  }

  if (hasDiscount) {
    priceBoundsParams.has_discount = true;
  }

  const [categoryTree, categories, products, cart, favorites, facets] = await Promise.all([
    categoryApi.getTree(),
    categoryApi.getList(),
    getCatalogProducts(productParams, page, pageSize),
    fallbackOnUnauthorized(cartApi.get(), emptyCartResponse),
    fallbackOnUnauthorized(
      favoriteApi.getList({ page: 1, limit: 100 }, accessToken),
      emptyFavoritesResponse,
    ),
    productApi.getFacets({
      category_id: categoryId,
      store_id: storeId,
    }),
  ]);

  const visibleCategories = categories.items.length > 0 ? categories.items : categoryTree.items;
  const selectedCategory = visibleCategories.find((category) => category.id === categoryId);
  const favoriteProductIds = favorites.items.map((product) => product.id);
  const cartProductIds = cart.items.map((item) => item.product_id);

  const urlParams = toCatalogUrlParams(searchParams);
  const rawMaxPrice = Number(facets.max_price) || 500;
  const sliderMax = Math.max(Math.ceil(rawMaxPrice), Number(maxPrice) || 0, Number(minPrice) || 0);

  const quickFilterChips = [
    {
      id: "farm",
      label: "🌿 Фермерское",
      active: tag === "farm",
      href: buildCatalogHref({
        ...urlParams,
        tag: tag === "farm" ? undefined : "farm",
        page: undefined,
      }),
    },
  ];

  return (
    <>
      <Header />
      <main className="pb-24 md:pb-12">
        <Container className="py-6">
          <nav className="text-slate-500 mb-5 flex items-center gap-2 text-sm">
            <Link className="hover:text-emerald-700 transition" href={ROUTES.HOME}>
              Главная
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">Каталог</span>
          </nav>

          <h1 className="text-slate-900 mb-6 text-3xl sm:text-4xl font-black tracking-tight">Каталог товаров</h1>

          <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
            {/* Сайдбар фильтров на десктопе */}
            <div className="hidden lg:block">
              <CatalogSidebar
                categories={visibleCategories}
                currentCategoryId={categoryId}
                currentParams={urlParams}
                hasDiscount={hasDiscount}
                hasDiscountAvailable={facets.has_discounts}
                hasHalalAvailable={facets.has_halal}
                discountCount={facets.discount_count}
                halalCount={facets.halal_count}
                isHalal={tag === "halal"}
                maxPrice={maxPrice}
                minPrice={minPrice}
                sliderMax={sliderMax}
              />
            </div>

            <section className="min-w-0">
              {/* Мобильная панель фильтров и сортировки (sticky) */}
              <CatalogControls
                categories={visibleCategories}
                currentParams={urlParams}
                currentSort={sort}
                hasDiscount={hasDiscount}
                hasDiscountAvailable={facets.has_discounts}
                hasHalalAvailable={facets.has_halal}
                discountCount={facets.discount_count}
                halalCount={facets.halal_count}
                isHalal={tag === "halal"}
                maxPrice={maxPrice}
                minPrice={minPrice}
                productsTotal={products.total}
                sliderMax={sliderMax}
              />

              {/* Десктопный тулбар каталога */}
              <CatalogToolbar
                currentParams={urlParams}
                hasDiscount={hasDiscount}
                selectedCategoryName={selectedCategory?.name}
                productsTotal={products.total}
                minPrice={minPrice}
                maxPrice={maxPrice}
                sort={sort}
                viewMode={viewMode}
              />

              {/* Компактная лента БЫСТРЫХ ТЕГОВ */}
              <div className="my-5">
                <QuickFilterChips
                  chips={quickFilterChips}
                  className="py-1"
                />
              </div>

              {/* Сетка товаров */}
              {products.items.length > 0 ? (
                <CatalogProductFeed
                  key={`${JSON.stringify(productParams)}:${viewMode}`}
                  initialProducts={products}
                  params={productParams}
                  viewMode={viewMode}
                  cartProductIds={cartProductIds}
                  favoriteProductIds={favoriteProductIds}
                />
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

interface CatalogToolbarProps {
  sort: NonNullable<ProductListParams["sort"]>;
  currentParams: CatalogUrlParams;
  hasDiscount: boolean;
  productsTotal: number;
  selectedCategoryName?: string | undefined;
  minPrice?: string | undefined;
  maxPrice?: string | undefined;
  viewMode: ProductViewMode;
}

const CatalogToolbar = ({
  currentParams,
  hasDiscount,
  maxPrice,
  minPrice,
  productsTotal,
  selectedCategoryName,
  sort,
  viewMode,
}: CatalogToolbarProps) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-slate-600 text-sm font-semibold">
            {formatFoundProducts(productsTotal)}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedCategoryName ? <FilterChip label={selectedCategoryName} /> : null}
            {hasDiscount ? <FilterChip label="Со скидкой" /> : null}
            {maxPrice ? <FilterChip label={`Цена: до ${maxPrice} ₽`} /> : null}
            {minPrice ? <FilterChip label={`Цена: от ${minPrice} ₽`} /> : null}
            <Link
              className="text-emerald-700 hover:text-emerald-800 px-2 py-2 text-sm font-semibold transition"
              href={ROUTES.CATALOG}
            >
              Сбросить все
            </Link>
          </div>
        </div>
        <div className="hidden lg:flex max-w-full flex-wrap items-center gap-4">
          <AutoSubmitSelect
            action={ROUTES.CATALOG}
            defaultValue={sort}
            hiddenFields={getCatalogSortHiddenFields({
              category_id: currentParams.category_id,
              has_discount: currentParams.has_discount,
              limit: currentParams.limit,
              max_price: maxPrice,
              min_price: minPrice,
              view: viewMode === "list" ? viewMode : undefined,
            })}
            label="Сортировать:"
            name="sort"
            options={sortOptions}
          />
          <ViewModeToggle
            gridHref={buildCatalogHref({ ...currentParams, page: undefined, view: undefined })}
            listHref={buildCatalogHref({ ...currentParams, page: undefined, view: "list" })}
            viewMode={viewMode}
          />
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
    <span className="border border-emerald-200/80 bg-emerald-50/70 text-emerald-800 rounded-lg px-3 py-1.5 text-xs font-semibold">
      {label}
    </span>
  );
};

const CatalogEmptyState = () => {
  return (
    <div className="border border-slate-200 mt-5 rounded-2xl bg-white p-10 text-center shadow-xs">
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-3">
        <Package size={28} />
      </div>
      <h2 className="text-slate-900 text-lg font-bold">Товары не найдены</h2>
      <p className="text-slate-500 mt-2 text-xs leading-relaxed max-w-sm mx-auto">
        По выбранным фильтрам ничего не найдено. Попробуйте сбросить параметры или изменить поисковый запрос.
      </p>
      <Link
        className="bg-emerald-600 text-white hover:bg-emerald-700 mt-5 inline-flex h-11 items-center justify-center rounded-xl px-6 text-xs font-bold transition shadow-sm"
        href={ROUTES.CATALOG}
      >
        Сбросить фильтры
      </Link>
    </div>
  );
};



const toCatalogUrlParams = (searchParams: CatalogSearchParams): CatalogUrlParams => ({
  article: searchParams.article,
  category_id: searchParams.category_id,
  has_discount: searchParams.has_discount,
  in_stock: undefined, // наличие не передается в URL, так как действует всегда
  limit: searchParams.limit,
  max_price: searchParams.max_price,
  min_price: searchParams.min_price,
  page: searchParams.page,
  product_type: searchParams.product_type,
  sort: searchParams.sort,
  tag: searchParams.tag,
  view: searchParams.view,
});

const getCatalogSortHiddenFields = (
  params: Record<string, string | undefined>,
): Array<{ name: string; value: string }> =>
  Object.entries(params)
    .filter(([, value]) => Boolean(value))
    .map(([name, value]) => ({ name, value: String(value) }));

const toPositiveNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

const toPageSize = (value: string | undefined): number => {
  const parsed = Number(value);

  return parsed === 48 || parsed === 96 ? parsed : 24;
};

const toOptionalNumber = (value: string | undefined): number | undefined => {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : undefined;
};

const toOptionalPrice = (value: string | undefined): string | undefined => {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed >= 0 ? String(Math.floor(parsed)) : undefined;
};

const toCatalogSort = (
  value: string | undefined,
): NonNullable<ProductListParams["sort"]> => {
  if (
    value === "price_asc" ||
    value === "price_desc" ||
    value === "newest" ||
    value === "name_asc" ||
    value === "name_desc"
  ) {
    return value;
  }

  return "popular";
};

const toViewMode = (value: string | undefined): ProductViewMode => {
  return value === "list" ? "list" : "grid";
};

const getCatalogProducts = async (
  params: ProductListParams,
  page: number,
  limit: number,
): Promise<ProductListResponse> => {
  try {
    return await productApi.getList(params);
  } catch (error) {
    if (isApiErrorStatus(error, 404) && page > 1) {
      return productApi.getList({ ...params, page: 1 });
    }

    return {
      items: [],
      limit,
      page,
      pages: 1,
      total: 0,
    };
  }
};

const getAccessToken = async (): Promise<string | undefined> => {
  const cookieStore = await cookies();

  return cookieStore.get("access_token")?.value;
};

const getSelectedStoreId = async (): Promise<number | undefined> => {
  const cookieStore = await cookies();
  const storeId = Number(cookieStore.get("current_store_id")?.value);
  return Number.isInteger(storeId) && storeId > 0 ? storeId : undefined;
};
