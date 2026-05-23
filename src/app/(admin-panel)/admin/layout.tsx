import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuthApi } from "@/entities/admin-auth";
import { ROUTES } from "@/shared/config";
import { AdminShell } from "@/widgets/admin-layout";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("admin_access_token")?.value;

  if (!accessToken) {
    redirect(ROUTES.ADMIN_LOGIN);
  }

  try {
    const [currentUser, rolesResponse] = await Promise.all([
      adminAuthApi.getMe(accessToken),
      adminAuthApi.getRoles(accessToken),
    ]);

    return (
      <AdminShell currentUser={currentUser} roles={rolesResponse.items}>
        {children}
      </AdminShell>
    );
  } catch {
    redirect(ROUTES.ADMIN_LOGIN);
  }
}
