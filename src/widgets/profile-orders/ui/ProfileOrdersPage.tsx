import type { ProfileOrderListResponse } from "@/entities/order";
import { AuthGuard } from "@/shared/ui";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";
import { ProfileOrdersView } from "./ProfileOrdersView";

const emptyOrders: ProfileOrderListResponse = {
  items: [],
  total: 0,
  limit: 20,
  offset: 0,
};

export const ProfileOrdersPage = () => {
  return (
    <AuthGuard>
      <Header />
      <ProfileOrdersView initialOrders={emptyOrders} />
      <Footer />
    </AuthGuard>
  );
};
