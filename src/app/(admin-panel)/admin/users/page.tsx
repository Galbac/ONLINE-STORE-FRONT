import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminUserApi } from "@/entities/admin-user";
import type { AdminUserListParams } from "@/entities/admin-user";
import { ROUTES } from "@/shared/config";
import { AdminUsersView, type AdminUserFilters } from "@/widgets/admin-users";

interface AdminUsersPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const dynamic = "force-dynamic";

const USERS_PAGE_LIMIT = "20";

export default async function Page({ searchParams }: AdminUsersPageProps) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("admin_access_token")?.value;

  if (!accessToken) {
    redirect(ROUTES.ADMIN_LOGIN);
  }

  const filters = getFilters(await searchParams);

  try {
    const users = await adminUserApi.getList(getUserListParams(filters), accessToken);

    return <AdminUsersView filters={filters} users={users} />;
  } catch {
    return (
      <section className="border-border bg-bg-primary shadow-soft rounded-lg border p-5 sm:p-6">
        <h1 className="text-text-primary text-2xl font-bold">Пользователи</h1>
        <p className="text-text-secondary mt-3 leading-7">
          Не удалось загрузить список пользователей. Обновите страницу или войдите заново.
        </p>
      </section>
    );
  }
}

const getFilters = (
  searchParams: Record<string, string | string[] | undefined>,
): AdminUserFilters => {
  return {
    is_active: getSearchParam(searchParams.is_active),
    is_blocked: getSearchParam(searchParams.is_blocked),
    page: getPageParam(searchParams.page),
    q: getSearchParam(searchParams.q),
  };
};

const getUserListParams = (filters: AdminUserFilters): AdminUserListParams => {
  const params: AdminUserListParams = {
    limit: USERS_PAGE_LIMIT,
    page: filters.page,
  };

  if (filters.is_active) {
    params.is_active = filters.is_active;
  }

  if (filters.is_blocked) {
    params.is_blocked = filters.is_blocked;
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
