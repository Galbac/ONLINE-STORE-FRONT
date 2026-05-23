import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminDashboardApi } from "@/entities/admin-dashboard";
import { ROUTES } from "@/shared/config";
import { AdminDashboardView } from "@/widgets/admin-dashboard";

export const dynamic = "force-dynamic";

const DASHBOARD_SALES_DAYS = 14;

export default async function Page() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("admin_access_token")?.value;

  if (!accessToken) {
    redirect(ROUTES.ADMIN_LOGIN);
  }

  const dateRange = getSalesDateRange(DASHBOARD_SALES_DAYS);

  try {
    const [dashboard, sales, lowStock] = await Promise.all([
      adminDashboardApi.getSummary(accessToken),
      adminDashboardApi.getSales(
        {
          date_from: dateRange.dateFrom,
          date_to: dateRange.dateTo,
          group_by: "day",
        },
        accessToken,
      ),
      adminDashboardApi.getLowStock(
        {
          limit: 6,
          offset: 0,
        },
        accessToken,
      ),
    ]);

    return <AdminDashboardView dashboard={dashboard} lowStock={lowStock} sales={sales} />;
  } catch {
    return (
      <section className="border-border bg-bg-primary rounded-lg border p-5 shadow-soft sm:p-6">
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary mt-3 leading-7">
          Не удалось загрузить данные dashboard. Обновите страницу или войдите заново.
        </p>
      </section>
    );
  }
}

const getSalesDateRange = (days: number): { dateFrom: string; dateTo: string } => {
  const dateTo = new Date();
  const dateFrom = new Date();
  dateFrom.setDate(dateTo.getDate() - (days - 1));

  return {
    dateFrom: toIsoDate(dateFrom),
    dateTo: toIsoDate(dateTo),
  };
};

const toIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};
