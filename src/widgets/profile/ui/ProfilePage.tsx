import { authApi } from "@/entities/auth";
import { profileApi } from "@/entities/profile";
import { userApi } from "@/entities/user";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";
import { ProfileView } from "./ProfileView";

export const ProfilePage = async () => {
  const [profile, user] = await Promise.all([
    profileApi.getSummary(),
    userApi.getMe(),
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
