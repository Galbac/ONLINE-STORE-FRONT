import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { adminOrderApi } from "@/entities/admin-order";
import { ROUTES } from "@/shared/config";
import { AdminOrderPrintView } from "@/widgets/admin-order-print";

interface AdminOrderPrintRouteProps {
  params: Promise<{
    orderId: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function Page({ params }: AdminOrderPrintRouteProps) {
  const { orderId } = await params;
  const parsedOrderId = Number(orderId);

  if (!Number.isInteger(parsedOrderId) || parsedOrderId < 1) {
    notFound();
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("admin_access_token")?.value;

  if (!accessToken) {
    redirect(ROUTES.ADMIN_LOGIN);
  }

  try {
    const printData = await adminOrderApi.getPrint(parsedOrderId, accessToken);

    return <AdminOrderPrintView orderId={parsedOrderId} printData={printData} />;
  } catch {
    return (
      <section className="border-border bg-bg-primary shadow-soft rounded-lg border p-5 sm:p-6">
        <h1 className="text-text-primary text-2xl font-bold">Печатная версия заказа</h1>
        <p className="text-text-secondary mt-3 leading-7">
          Не удалось загрузить печатную форму. Обновите страницу или вернитесь к заказу.
        </p>
      </section>
    );
  }
}
