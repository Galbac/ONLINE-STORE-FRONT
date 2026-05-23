import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { adminOrderApi } from "@/entities/admin-order";
import { paymentApi } from "@/entities/payment";
import { ROUTES } from "@/shared/config";
import { AdminOrderDetailsView } from "@/widgets/admin-order-details";

interface AdminOrderDetailsRouteProps {
  params: Promise<{
    orderId: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function Page({ params }: AdminOrderDetailsRouteProps) {
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
    const order = await adminOrderApi.getById(parsedOrderId, accessToken);
    const payment = order.payment
      ? await paymentApi.getById(order.payment.id, accessToken).catch(() => null)
      : null;

    return <AdminOrderDetailsView initialOrder={order} initialPayment={payment} />;
  } catch {
    return (
      <section className="border-border bg-bg-primary shadow-soft rounded-lg border p-5 sm:p-6">
        <h1 className="text-text-primary text-2xl font-bold">Детали заказа</h1>
        <p className="text-text-secondary mt-3 leading-7">
          Не удалось загрузить заказ. Обновите страницу или вернитесь к списку.
        </p>
      </section>
    );
  }
}
