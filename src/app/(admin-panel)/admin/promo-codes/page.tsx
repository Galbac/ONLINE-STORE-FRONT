import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminPromoCodeApi, type AdminPromoCodeListParams } from "@/entities/admin-promo-code";
import { ROUTES } from "@/shared/config";
import { AdminPromoCodesView, type AdminPromoCodeFilters } from "@/widgets/admin-promo-codes";

interface AdminPromoCodesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const dynamic = "force-dynamic";

const PROMO_CODES_PAGE_LIMIT = "20";

export default async function Page({ searchParams }: AdminPromoCodesPageProps) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("admin_access_token")?.value;

  if (!accessToken) {
    redirect(ROUTES.ADMIN_LOGIN);
  }

  const filters = getFilters(await searchParams);

  try {
    const promoCodes = await adminPromoCodeApi.getList(
      getPromoCodeListParams(filters),
      accessToken,
    );

    return <AdminPromoCodesView filters={filters} promoCodes={promoCodes} />;
  } catch {
    return (
      <section className="border-border bg-bg-primary shadow-soft rounded-lg border p-5 sm:p-6">
        <h1 className="text-text-primary text-2xl font-bold">Промокоды</h1>
        <p className="text-text-secondary mt-3 leading-7">
          Не удалось загрузить список промокодов. Обновите страницу или войдите заново.
        </p>
      </section>
    );
  }
}

const getFilters = (
  searchParams: Record<string, string | string[] | undefined>,
): AdminPromoCodeFilters => {
  return {
    is_active: getSearchParam(searchParams.is_active),
    page: getPageParam(searchParams.page),
    q: getSearchParam(searchParams.q),
  };
};

const getPromoCodeListParams = (filters: AdminPromoCodeFilters): AdminPromoCodeListParams => {
  const params: AdminPromoCodeListParams = {
    limit: PROMO_CODES_PAGE_LIMIT,
    page: filters.page,
  };

  if (filters.is_active) {
    params.is_active = filters.is_active;
  }

  if (filters.q) {
    params.q = filters.q;
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
