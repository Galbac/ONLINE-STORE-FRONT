"use client";

import { AuthGuard } from "@/shared/ui";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";
import { ProfileNotificationsView } from "./ProfileNotificationsView";

export const ProfileNotificationsPage = () => {
  return (
    <AuthGuard>
      <Header />
      <ProfileNotificationsView />
      <Footer />
    </AuthGuard>
  );
};
