import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminOneCApi } from "@/entities/admin-integration";
import { ROUTES } from "@/shared/config";
import { AdminOneCIntegrationView } from "@/widgets/admin-one-c-integration";

export const dynamic = "force-dynamic";

export default async function Page() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("admin_access_token")?.value;

  if (!accessToken) {
    redirect(ROUTES.ADMIN_LOGIN);
  }

  const [statusResult, healthResult] = await Promise.allSettled([
    adminOneCApi.getStatus(accessToken),
    adminOneCApi.getHealth(accessToken),
  ]);

  return (
    <AdminOneCIntegrationView
      health={healthResult.status === "fulfilled" ? healthResult.value : null}
      status={statusResult.status === "fulfilled" ? statusResult.value : null}
    />
  );
}
