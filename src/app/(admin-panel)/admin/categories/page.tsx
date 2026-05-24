import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminCategoryApi } from "@/entities/admin-category";
import { ROUTES } from "@/shared/config";
import { AdminCategoriesPage } from "@/widgets/admin-categories";

export const dynamic = "force-dynamic";

export default async function Page() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("admin_access_token")?.value;

  if (!accessToken) {
    redirect(ROUTES.ADMIN_LOGIN);
  }

  try {
    const categories = await adminCategoryApi.getList(
      {
        include_deleted: "false",
        limit: "100",
        page: "1",
      },
      accessToken,
    );

    return <AdminCategoriesPage categories={categories.items} />;
  } catch {
    return (
      <section className="border-border bg-bg-primary shadow-soft rounded-lg border p-5 sm:p-6">
        <h1 className="text-text-primary text-2xl font-bold">Категории</h1>
        <p className="text-text-secondary mt-3 leading-7">
          Не удалось загрузить категории. Обновите страницу или войдите заново.
        </p>
      </section>
    );
  }
}
