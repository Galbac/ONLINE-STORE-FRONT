import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { adminCategoryApi } from "@/entities/admin-category";
import { adminDiscountApi } from "@/entities/admin-discount";
import { adminProductApi } from "@/entities/admin-product";
import { ROUTES } from "@/shared/config";
import { AdminDiscountDetailsView } from "@/widgets/admin-discount-details";
import { AdminDiscountFormView } from "@/widgets/admin-discount-form";

interface AdminDiscountDetailsRouteProps {
  params: Promise<{
    discountId: string;
  }>;
}

export const dynamic = "force-dynamic";

const RELATED_ITEMS_LIMIT = "100";

export default async function Page({ params }: AdminDiscountDetailsRouteProps) {
  const { discountId } = await params;
  const parsedDiscountId = Number(discountId);

  if (!Number.isInteger(parsedDiscountId) || parsedDiscountId < 1) {
    notFound();
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("admin_access_token")?.value;

  if (!accessToken) {
    redirect(ROUTES.ADMIN_LOGIN);
  }

  try {
    const [discount, productsResponse, categoriesResponse] = await Promise.all([
      adminDiscountApi.getById(parsedDiscountId, accessToken),
      adminProductApi.getList({ limit: RELATED_ITEMS_LIMIT, page: "1" }, accessToken),
      adminCategoryApi.getList(
        { include_deleted: "false", limit: RELATED_ITEMS_LIMIT, page: "1" },
        accessToken,
      ),
    ]);

    return (
      <div className="space-y-8">
        <AdminDiscountDetailsView discount={discount} />
        <AdminDiscountFormView
          categories={categoriesResponse.items}
          discount={discount}
          products={productsResponse.items}
        />
      </div>
    );
  } catch {
    return (
      <section className="border-border bg-bg-primary shadow-soft rounded-lg border p-5 sm:p-6">
        <h1 className="text-text-primary text-2xl font-bold">Карточка скидки</h1>
        <p className="text-text-secondary mt-3 leading-7">
          Не удалось загрузить скидку. Обновите страницу или вернитесь к списку.
        </p>
      </section>
    );
  }
}
