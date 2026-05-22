import {
  fallbackOrderDetail,
  fallbackOrderStatus,
  orderApi,
  type OrderDetailResponse,
  type OrderStatusResponse,
} from "@/entities/order";
import { fallbackPaymentDetail, paymentApi, type PaymentDetailResponse } from "@/entities/payment";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";
import { ProfileOrderDetailsView } from "./ProfileOrderDetailsView";

interface ProfileOrderDetailsPageProps {
  orderId: number;
}

export const ProfileOrderDetailsPage = async ({ orderId }: ProfileOrderDetailsPageProps) => {
  const order = await orderApi
    .getById(orderId)
    .catch((): OrderDetailResponse => fallbackOrderDetail);
  const status = await orderApi
    .getStatus(orderId)
    .catch((): OrderStatusResponse => fallbackOrderStatus);
  const payment = order.payment
    ? await paymentApi
        .getById(order.payment.id)
        .catch((): PaymentDetailResponse => fallbackPaymentDetail)
    : null;

  return (
    <>
      <Header />
      <ProfileOrderDetailsView
        initialOrder={order}
        initialPayment={payment}
        initialStatus={status}
      />
      <Footer />
    </>
  );
};
