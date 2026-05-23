import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminStaffApi, type AdminStaffListParams } from "@/entities/admin-staff";
import { ROUTES } from "@/shared/config";
import { AdminStaffView, type AdminStaffFilters } from "@/widgets/admin-staff";

interface AdminStaffPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const dynamic = "force-dynamic";

const STAFF_PAGE_LIMIT = "20";

export default async function Page({ searchParams }: AdminStaffPageProps) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("admin_access_token")?.value;

  if (!accessToken) {
    redirect(ROUTES.ADMIN_LOGIN);
  }

  const filters = getFilters(await searchParams);

  try {
    const [staff, rolesResponse] = await Promise.all([
      adminStaffApi.getList(getStaffListParams(filters), accessToken),
      adminStaffApi.getRoles(accessToken),
    ]);

    return <AdminStaffView filters={filters} roles={rolesResponse.items} staff={staff} />;
  } catch {
    return (
      <section className="border-border bg-bg-primary shadow-soft rounded-lg border p-5 sm:p-6">
        <h1 className="text-text-primary text-2xl font-bold">Сотрудники</h1>
        <p className="text-text-secondary mt-3 leading-7">
          Не удалось загрузить список сотрудников. Обновите страницу или войдите заново.
        </p>
      </section>
    );
  }
}

const getFilters = (
  searchParams: Record<string, string | string[] | undefined>,
): AdminStaffFilters => {
  return {
    is_active: getSearchParam(searchParams.is_active),
    page: getPageParam(searchParams.page),
    q: getSearchParam(searchParams.q),
    role: getSearchParam(searchParams.role),
  };
};

const getStaffListParams = (filters: AdminStaffFilters): AdminStaffListParams => {
  const params: AdminStaffListParams = {
    limit: STAFF_PAGE_LIMIT,
    page: filters.page,
  };

  if (filters.is_active) {
    params.is_active = filters.is_active;
  }

  if (filters.q) {
    params.q = filters.q;
  }

  if (filters.role) {
    params.role = filters.role;
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
