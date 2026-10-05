"use client";

import { AuthGuard } from "@/shared/ui";
import { Footer } from "@/widgets/footer";
import { ProfileUploadsView } from "./ProfileUploadsView";

export const ProfileUploadsPage = () => {
  return (
    <AuthGuard>
      <ProfileUploadsView />
      <Footer />
    </AuthGuard>
  );
};
