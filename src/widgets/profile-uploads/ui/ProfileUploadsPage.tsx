"use client";

import { AuthGuard } from "@/shared/ui";
import { Footer } from "@/widgets/footer";
import { Header } from "@/widgets/header";
import { ProfileUploadsView } from "./ProfileUploadsView";

export const ProfileUploadsPage = () => {
  return (
    <AuthGuard>
      <Header />
      <ProfileUploadsView />
      <Footer />
    </AuthGuard>
  );
};
