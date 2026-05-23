import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminOrderApi } from "@/entities/admin-order";
import type { AdminOrderListParams } from "@/entities/admin-order";
import { ROUTES } from "@/shared/config";
import { AdminOrdersView, type AdminOrderFilters } from "@/widgets/admin-orders";

interface AdminOrdersPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const dynamic = "force-dynamic";

const ORDERS_PAGE_LIMIT = "20";

export default async function Page({ searchParams }: AdminOrdersPageProps) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("admin_access_token")?.value;

  if (!accessToken) {
    redirect(ROUTES.ADMIN_LOGIN);
  }

  const filters = getFilters(await searchParams);

  try {
    const orders = await adminOrderApi.getList(getOrderListParams(filters), accessToken);

    return <AdminOrdersView filters={filters} orders={orders} />;
  } catch {
    return (
      <section className="border-border bg-bg-primary shadow-soft rounded-lg border p-5 sm:p-6">
        <h1 className="text-text-primary text-2xl font-bold">Заказы</h1>
        <p className="text-text-secondary mt-3 leading-7">
          Не удалось загрузить список заказов. Обновите страницу или войдите заново.
        </p>
      </section>
    );
  }
}

const getFilters = (
  searchParams: Record<string, string | string[] | undefined>,
): AdminOrderFilters => {
  return {
    date_from: getSearchParam(searchParams.date_from),
    date_to: getSearchParam(searchParams.date_to),
    delivery_type: getSearchParam(searchParams.delivery_type),
    page: getPageParam(searchParams.page),
    payment_status: getSearchParam(searchParams.payment_status),
    q: getSearchParam(searchParams.q),
    status: getSearchParam(searchParams.status),
    sync_status: getSearchParam(searchParams.sync_status),
  };
};

const getOrderListParams = (filters: AdminOrderFilters): AdminOrderListParams => {
  const params: AdminOrderListParams = {
    limit: ORDERS_PAGE_LIMIT,
    page: filters.page,
  };

  if (filters.date_from) {
    params.date_from = filters.date_from;
  }

  if (filters.date_to) {
    params.date_to = filters.date_to;
  }

  if (filters.delivery_type) {
    params.delivery_type = filters.delivery_type;
  }

  if (filters.payment_status) {
    params.payment_status = filters.payment_status;
  }

  if (filters.q) {
    params.q = filters.q;
  }

  if (filters.status) {
    params.status = filters.status;
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
