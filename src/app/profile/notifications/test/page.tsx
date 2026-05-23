import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ProfileNotificationTestPage } from "@/widgets/profile-notification-test";

export const dynamic = "force-dynamic";

export default async function NotificationTestRoute() {
  const cookieStore = await cookies();
  const adminAccessToken = cookieStore.get("admin_access_token")?.value;
  const isDevelopment = process.env.NODE_ENV === "development";

  if (!isDevelopment && !adminAccessToken) {
    notFound();
  }

  return <ProfileNotificationTestPage />;
}
