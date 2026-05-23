import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminDeliveryApi } from "@/entities/admin-delivery";
import { ROUTES } from "@/shared/config";
import { AdminDeliverySettingsView } from "@/widgets/admin-delivery-settings";

export const dynamic = "force-dynamic";

export default async function Page() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("admin_access_token")?.value;

  if (!accessToken) {
    redirect(ROUTES.ADMIN_LOGIN);
  }

  try {
    const settings = await adminDeliveryApi.getSettings(accessToken);
    return <AdminDeliverySettingsView settings={settings} />;
  } catch {
    return (
      <section className="border-border bg-bg-primary shadow-soft rounded-lg border p-5 sm:p-6">
        <h1 className="text-text-primary text-2xl font-bold">Настройки доставки</h1>
        <p className="text-text-secondary mt-3 leading-7">
          Не удалось загрузить настройки доставки. Обновите страницу или войдите заново.
        </p>
      </section>
    );
  }
}
