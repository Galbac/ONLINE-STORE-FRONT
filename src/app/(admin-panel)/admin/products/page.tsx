import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminCategoryApi } from "@/entities/admin-category";
import { adminDashboardApi } from "@/entities/admin-dashboard";
import { adminProductApi } from "@/entities/admin-product";
import type { AdminProductListParams } from "@/entities/admin-product";
import { ROUTES } from "@/shared/config";
import { AdminProductsView, type AdminProductFilters } from "@/widgets/admin-products";

interface AdminProductsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const dynamic = "force-dynamic";

const PRODUCTS_PAGE_LIMIT = "20";
const CATEGORY_FILTER_LIMIT = "100";

export default async function Page({ searchParams }: AdminProductsPageProps) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("admin_access_token")?.value;

  if (!accessToken) {
    redirect(ROUTES.ADMIN_LOGIN);
  }

  const filters = getFilters(await searchParams);
  const selectedCategoryId = Number(filters.category_id);

  try {
    const [products, categories, lowStock] = await Promise.all([
      adminProductApi.getList(getProductListParams(filters), accessToken),
      adminCategoryApi.getList(
        {
          include_deleted: "false",
          limit: CATEGORY_FILTER_LIMIT,
          page: "1",
        },
        accessToken,
      ),
      adminDashboardApi.getLowStock(
        Number.isFinite(selectedCategoryId)
          ? {
              category_id: selectedCategoryId,
              limit: 6,
              offset: 0,
            }
          : {
              limit: 6,
              offset: 0,
            },
        accessToken,
      ),
    ]);

    return (
      <AdminProductsView
        categories={categories}
        filters={filters}
        lowStock={lowStock}
        products={products}
      />
    );
  } catch {
    return (
      <section className="border-border bg-bg-primary rounded-lg border p-5 shadow-soft sm:p-6">
        <h1 className="text-2xl font-bold text-text-primary">Товары</h1>
        <p className="text-text-secondary mt-3 leading-7">
          Не удалось загрузить список товаров. Обновите страницу или войдите заново.
        </p>
      </section>
    );
  }
}

const getFilters = (
  searchParams: Record<string, string | string[] | undefined>,
): AdminProductFilters => {
  return {
    category_id: getSearchParam(searchParams.category_id),
    in_stock: getSearchParam(searchParams.in_stock),
    is_active: getSearchParam(searchParams.is_active),
    is_available: getSearchParam(searchParams.is_available),
    page: getPageParam(searchParams.page),
    q: getSearchParam(searchParams.q),
    sync_status: getSearchParam(searchParams.sync_status),
  };
};

const getProductListParams = (filters: AdminProductFilters): AdminProductListParams => {
  const params: AdminProductListParams = {
    limit: PRODUCTS_PAGE_LIMIT,
    page: filters.page,
  };

  if (filters.category_id) {
    params.category_id = filters.category_id;
  }

  if (filters.in_stock) {
    params.in_stock = filters.in_stock;
  }

  if (filters.is_active) {
    params.is_active = filters.is_active;
  }

  if (filters.q) {
    params.q = filters.q;
  }

  if (filters.sync_status) {
    params.sync_status = filters.sync_status;
  }

  return params;
};

const getSearchParam = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
};

const getPageParam = (value: string | string[] | undefined): string => {
  const page = Number(getSearchParam(value));

  if (!Number.isInteger(page) || page < 1) {
    return "1";
  }

  return String(page);
};
