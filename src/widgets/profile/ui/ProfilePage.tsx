import { authApi } from "@/entities/auth";
import { fallbackProfileSummary, profileApi } from "@/entities/profile";
import { fallbackUserMe, userApi } from "@/entities/user";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";
import { ProfileView } from "./ProfileView";

export const ProfilePage = async () => {
  const [profile, user] = await Promise.all([
    profileApi.getSummary().catch(() => fallbackProfileSummary),
    userApi.getMe().catch(() => fallbackUserMe),
    authApi.getMe("").catch(() => null),
  ]);

  return (
    <>
      <Header />
      <ProfileView profile={profile} user={user} />
      <Footer />
    </>
  );
};
