import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminDiscountApi, type AdminDiscountListParams } from "@/entities/admin-discount";
import { ROUTES } from "@/shared/config";
import { AdminDiscountsView, type AdminDiscountFilters } from "@/widgets/admin-discounts";

interface AdminDiscountsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const dynamic = "force-dynamic";

const DISCOUNTS_PAGE_LIMIT = "20";

export default async function Page({ searchParams }: AdminDiscountsPageProps) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("admin_access_token")?.value;

  if (!accessToken) {
    redirect(ROUTES.ADMIN_LOGIN);
  }

  const filters = getFilters(await searchParams);

  try {
    const discounts = await adminDiscountApi.getList(getDiscountListParams(filters), accessToken);

    return <AdminDiscountsView discounts={discounts} filters={filters} />;
  } catch {
    return (
      <section className="border-border bg-bg-primary shadow-soft rounded-lg border p-5 sm:p-6">
        <h1 className="text-text-primary text-2xl font-bold">Скидки</h1>
        <p className="text-text-secondary mt-3 leading-7">
          Не удалось загрузить список скидок. Обновите страницу или войдите заново.
        </p>
      </section>
    );
  }
}

const getFilters = (
  searchParams: Record<string, string | string[] | undefined>,
): AdminDiscountFilters => {
  return {
    is_active: getSearchParam(searchParams.is_active),
    page: getPageParam(searchParams.page),
    q: getSearchParam(searchParams.q),
    type: getSearchParam(searchParams.type),
  };
};

const getDiscountListParams = (filters: AdminDiscountFilters): AdminDiscountListParams => {
  const params: AdminDiscountListParams = {
    limit: DISCOUNTS_PAGE_LIMIT,
    page: filters.page,
  };

  if (filters.is_active) {
    params.is_active = filters.is_active;
  }

  if (filters.q) {
    params.q = filters.q;
  }

  if (filters.type) {
    params.type = filters.type;
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
