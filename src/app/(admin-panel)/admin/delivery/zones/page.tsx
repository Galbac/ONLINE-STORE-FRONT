import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminDeliveryApi, type AdminDeliveryListParams } from "@/entities/admin-delivery";
import { ROUTES } from "@/shared/config";
import { AdminDeliveryZonesView, type AdminDeliveryFilters } from "@/widgets/admin-delivery-zones";

interface AdminDeliveryZonesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const dynamic = "force-dynamic";

const PAGE_LIMIT = "20";

export default async function Page({ searchParams }: AdminDeliveryZonesPageProps) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("admin_access_token")?.value;

  if (!accessToken) {
    redirect(ROUTES.ADMIN_LOGIN);
  }

  const filters = getFilters(await searchParams);

  try {
    const zones = await adminDeliveryApi.getZones(getListParams(filters), accessToken);
    return <AdminDeliveryZonesView filters={filters} zones={zones} />;
  } catch {
    return (
      <section className="border-border bg-bg-primary shadow-soft rounded-lg border p-5 sm:p-6">
        <h1 className="text-text-primary text-2xl font-bold">Зоны доставки</h1>
        <p className="text-text-secondary mt-3 leading-7">
          Не удалось загрузить зоны доставки. Обновите страницу или войдите заново.
        </p>
      </section>
    );
  }
}

const getFilters = (
  searchParams: Record<string, string | string[] | undefined>,
): AdminDeliveryFilters => ({
  city: getSearchParam(searchParams.city),
  is_active: getSearchParam(searchParams.is_active),
  page: getPageParam(searchParams.page),
  q: getSearchParam(searchParams.q),
});

const getListParams = (filters: AdminDeliveryFilters): AdminDeliveryListParams => {
  const params: AdminDeliveryListParams = {
    include_deleted: "false",
    limit: PAGE_LIMIT,
    page: filters.page,
  };
  if (filters.city) params.city = filters.city;
  if (filters.is_active) params.is_active = filters.is_active;
  if (filters.q) params.q = filters.q;
  return params;
};

const getSearchParam = (value: string | string[] | undefined): string =>
  Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
const getPageParam = (value: string | string[] | undefined): string => {
  const page = Number(getSearchParam(value));
  return Number.isInteger(page) && page > 0 ? String(page) : "1";
};
