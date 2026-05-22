import { orderApi } from "@/entities/order";
import { paymentApi } from "@/entities/payment";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";
import { ProfileOrderDetailsView } from "./ProfileOrderDetailsView";

interface ProfileOrderDetailsPageProps {
  orderId: number;
}

export const ProfileOrderDetailsPage = async ({ orderId }: ProfileOrderDetailsPageProps) => {
  const order = await orderApi.getById(orderId);
  const status = await orderApi.getStatus(orderId);
  const payment = order.payment ? await paymentApi.getById(order.payment.id) : null;

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
