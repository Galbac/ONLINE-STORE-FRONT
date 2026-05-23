import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminCategoryApi } from "@/entities/admin-category";
import { adminProductApi } from "@/entities/admin-product";
import { ROUTES } from "@/shared/config";
import { AdminDiscountFormView } from "@/widgets/admin-discount-form";

export const dynamic = "force-dynamic";

const RELATED_ITEMS_LIMIT = "100";

export default async function Page() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("admin_access_token")?.value;

  if (!accessToken) {
    redirect(ROUTES.ADMIN_LOGIN);
  }

  try {
    const [productsResponse, categoriesResponse] = await Promise.all([
      adminProductApi.getList({ limit: RELATED_ITEMS_LIMIT, page: "1" }, accessToken),
      adminCategoryApi.getList(
        { include_deleted: "false", limit: RELATED_ITEMS_LIMIT, page: "1" },
        accessToken,
      ),
    ]);

    return (
      <AdminDiscountFormView
        categories={categoriesResponse.items}
        products={productsResponse.items}
      />
    );
  } catch {
    return (
      <section className="border-border bg-bg-primary shadow-soft rounded-lg border p-5 sm:p-6">
        <h1 className="text-text-primary text-2xl font-bold">Создание скидки</h1>
        <p className="text-text-secondary mt-3 leading-7">
          Не удалось загрузить товары и категории. Обновите страницу или войдите заново.
        </p>
      </section>
    );
  }
}
