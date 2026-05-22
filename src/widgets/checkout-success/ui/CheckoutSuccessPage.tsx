import { orderApi } from "@/entities/order";
import { paymentApi } from "@/entities/payment";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";
import { CheckoutSuccessView } from "./CheckoutSuccessView";

interface CheckoutSuccessPageProps {
  orderId: number | null;
  paymentId: number | null;
}

export const CheckoutSuccessPage = async ({ orderId, paymentId }: CheckoutSuccessPageProps) => {
  const [order, status, payment] = await Promise.all([
    orderId ? orderApi.getById(orderId) : null,
    orderId ? orderApi.getStatus(orderId) : null,
    paymentId ? paymentApi.getById(paymentId) : null,
  ]);

  if (!order || !status || !payment) {
    throw new Error("Order or payment id is required for checkout success page.");
  }

  return (
    <>
      <Header />
      <CheckoutSuccessView order={order} payment={payment} status={status} />
      <Footer />
    </>
  );
};
