import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ROUTES } from "@/shared/config";
import { AdminUploadsView } from "@/widgets/admin-uploads";

export const dynamic = "force-dynamic";

export default async function Page() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("admin_access_token")?.value;

  if (!accessToken) {
    redirect(ROUTES.ADMIN_LOGIN);
  }

  return <AdminUploadsView />;
}
