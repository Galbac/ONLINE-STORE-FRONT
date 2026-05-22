import { fallbackOrderDetail, fallbackOrderStatus, orderApi } from "@/entities/order";
import { fallbackPaymentDetail, paymentApi } from "@/entities/payment";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";
import { CheckoutSuccessView } from "./CheckoutSuccessView";

interface CheckoutSuccessPageProps {
  orderId: number | null;
  paymentId: number | null;
}

export const CheckoutSuccessPage = async ({ orderId, paymentId }: CheckoutSuccessPageProps) => {
  const [order, status, payment] = await Promise.all([
    orderId ? orderApi.getById(orderId).catch(() => fallbackOrderDetail) : fallbackOrderDetail,
    orderId ? orderApi.getStatus(orderId).catch(() => fallbackOrderStatus) : fallbackOrderStatus,
    paymentId
      ? paymentApi.getById(paymentId).catch(() => fallbackPaymentDetail)
      : fallbackPaymentDetail,
  ]);

  return (
    <>
      <Header />
      <CheckoutSuccessView order={order} payment={payment} status={status} />
      <Footer />
    </>
  );
};
