import { fallbackAddresses, profileApi } from "@/entities/profile";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";
import { ProfileAddressesView } from "./ProfileAddressesView";

export const ProfileAddressesPage = async () => {
  const addresses = await profileApi.getAddresses().catch(() => fallbackAddresses);

  return (
    <>
      <Header />
      <ProfileAddressesView initialAddresses={addresses} />
      <Footer />
    </>
  );
};
