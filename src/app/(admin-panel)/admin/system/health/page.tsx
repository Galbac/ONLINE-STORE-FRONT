import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminSystemHealthApi } from "@/entities/admin-system-health";
import { ROUTES } from "@/shared/config";
import { AdminSystemHealthView } from "@/widgets/admin-system-health";

export const dynamic = "force-dynamic";

export default async function Page() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("admin_access_token")?.value;

  if (!accessToken) {
    redirect(ROUTES.ADMIN_LOGIN);
  }

  const health = await adminSystemHealthApi.getAll(accessToken);

  return <AdminSystemHealthView health={health} />;
}
