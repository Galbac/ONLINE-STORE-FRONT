"use client";

import { AuthGuard, Container } from "@/shared/ui";
import { Footer } from "@/widgets/footer";
import { ProfileNotificationsView } from "./ProfileNotificationsView";

export const ProfileNotificationsPage = () => {
  return (
    <>
      <AuthGuard fallback={<NotificationsAccessSkeleton />}>
        <ProfileNotificationsView />
      </AuthGuard>
      <Footer />
    </>
  );
};

const NotificationsAccessSkeleton = () => (
  <main className="min-h-[75vh] bg-slate-50/50 py-6 md:py-10" aria-busy="true">
    <Container>
      <div className="mb-6 h-4 w-48 animate-pulse rounded bg-slate-200" />
      <div className="mb-6 h-10 w-56 animate-pulse rounded-xl bg-slate-200" />
      <div className="mb-6 flex gap-2 overflow-hidden">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-11 w-32 shrink-0 animate-pulse rounded-xl bg-slate-200" />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        ))}
      </div>
    </Container>
  </main>
);
