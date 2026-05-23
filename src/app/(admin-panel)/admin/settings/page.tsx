import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminSettingsApi } from "@/entities/admin-settings";
import { ROUTES } from "@/shared/config";
import { AdminSettingsView } from "@/widgets/admin-settings";

export const dynamic = "force-dynamic";

export default async function Page() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("admin_access_token")?.value;

  if (!accessToken) {
    redirect(ROUTES.ADMIN_LOGIN);
  }

  try {
    const settings = await adminSettingsApi.get(accessToken);
    return <AdminSettingsView settings={settings} />;
  } catch {
    return (
      <section className="border-border bg-bg-primary shadow-soft rounded-lg border p-5 sm:p-6">
        <h1 className="text-text-primary text-2xl font-bold">Общие настройки</h1>
        <p className="text-text-secondary mt-3 leading-7">
          Не удалось загрузить общие настройки. Обновите страницу или войдите заново.
        </p>
      </section>
    );
  }
}
