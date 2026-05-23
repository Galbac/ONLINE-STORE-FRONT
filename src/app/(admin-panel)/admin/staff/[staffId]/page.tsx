import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { adminStaffApi } from "@/entities/admin-staff";
import { ROUTES } from "@/shared/config";
import { AdminStaffDetailsView } from "@/widgets/admin-staff-details";

interface AdminStaffDetailsRouteProps {
  params: Promise<{
    staffId: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function Page({ params }: AdminStaffDetailsRouteProps) {
  const { staffId } = await params;
  const parsedStaffId = Number(staffId);

  if (!Number.isInteger(parsedStaffId) || parsedStaffId < 1) {
    notFound();
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("admin_access_token")?.value;

  if (!accessToken) {
    redirect(ROUTES.ADMIN_LOGIN);
  }

  try {
    const [staff, rolesResponse] = await Promise.all([
      adminStaffApi.getById(parsedStaffId, accessToken),
      adminStaffApi.getRoles(accessToken),
    ]);

    return <AdminStaffDetailsView initialStaff={staff} roles={rolesResponse.items} />;
  } catch {
    return (
      <section className="border-border bg-bg-primary shadow-soft rounded-lg border p-5 sm:p-6">
        <h1 className="text-text-primary text-2xl font-bold">Карточка сотрудника</h1>
        <p className="text-text-secondary mt-3 leading-7">
          Не удалось загрузить сотрудника. Обновите страницу или вернитесь к списку.
        </p>
      </section>
    );
  }
}
