import { orderApi } from "@/entities/order";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";
import { ProfileOrdersView } from "./ProfileOrdersView";

export const ProfileOrdersPage = async () => {
  const orders = await orderApi.getProfileOrders({ offset: 0, limit: 20 });

  return (
    <>
      <Header />
      <ProfileOrdersView initialOrders={orders} />
      <Footer />
    </>
  );
};
