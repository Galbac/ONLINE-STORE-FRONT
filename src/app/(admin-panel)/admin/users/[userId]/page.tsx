import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { adminUserApi } from "@/entities/admin-user";
import { ROUTES } from "@/shared/config";
import { AdminUserDetailsView } from "@/widgets/admin-user-details";

interface AdminUserDetailsRouteProps {
  params: Promise<{
    userId: string;
  }>;
}

export const dynamic = "force-dynamic";

const USER_ORDERS_LIMIT = "20";

export default async function Page({ params }: AdminUserDetailsRouteProps) {
  const { userId } = await params;
  const parsedUserId = Number(userId);

  if (!Number.isInteger(parsedUserId) || parsedUserId < 1) {
    notFound();
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("admin_access_token")?.value;

  if (!accessToken) {
    redirect(ROUTES.ADMIN_LOGIN);
  }

  try {
    const [user, orders] = await Promise.all([
      adminUserApi.getById(parsedUserId, accessToken),
      adminUserApi.getOrders(
        parsedUserId,
        {
          limit: USER_ORDERS_LIMIT,
          page: "1",
        },
        accessToken,
      ),
    ]);

    return <AdminUserDetailsView initialOrders={orders} initialUser={user} />;
  } catch {
    return (
      <section className="border-border bg-bg-primary shadow-soft rounded-lg border p-5 sm:p-6">
        <h1 className="text-text-primary text-2xl font-bold">Карточка пользователя</h1>
        <p className="text-text-secondary mt-3 leading-7">
          Не удалось загрузить пользователя. Обновите страницу или вернитесь к списку.
        </p>
      </section>
    );
  }
}
