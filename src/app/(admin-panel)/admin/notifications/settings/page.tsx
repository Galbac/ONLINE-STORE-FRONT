import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminNotificationApi } from "@/entities/admin-notification";
import { ROUTES } from "@/shared/config";
import { AdminNotificationSettingsView } from "@/widgets/admin-notification-settings";

export const dynamic = "force-dynamic";

export default async function Page() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("admin_access_token")?.value;

  if (!accessToken) {
    redirect(ROUTES.ADMIN_LOGIN);
  }

  try {
    const settings = await adminNotificationApi.getSettings(accessToken);
    return <AdminNotificationSettingsView settings={settings} />;
  } catch {
    return (
      <section className="border-border bg-bg-primary shadow-soft rounded-lg border p-5 sm:p-6">
        <h1 className="text-text-primary text-2xl font-bold">Настройки уведомлений</h1>
        <p className="text-text-secondary mt-3 leading-7">
          Backend вернул 500 для ручки настроек уведомлений. Страница доступна, но данные настроек
          сейчас не получены.
        </p>
      </section>
    );
  }
}
