import type { AddressListResponse } from "@/entities/profile";
import { AuthGuard } from "@/shared/ui";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";
import { ProfileAddressesView } from "./ProfileAddressesView";

const emptyAddresses: AddressListResponse = {
  items: [],
  total: 0,
  limit: 100,
  offset: 0,
};

export const ProfileAddressesPage = () => {
  return (
    <AuthGuard>
      <Header />
      <ProfileAddressesView initialAddresses={emptyAddresses} />
      <Footer />
    </AuthGuard>
  );
};
