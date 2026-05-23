import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { adminCategoryApi } from "@/entities/admin-category";
import { adminProductApi } from "@/entities/admin-product";
import { adminPromoCodeApi } from "@/entities/admin-promo-code";
import { ROUTES } from "@/shared/config";
import { AdminPromoCodeDetailsView } from "@/widgets/admin-promo-code-details";
import { AdminPromoCodeFormView } from "@/widgets/admin-promo-code-form";

interface AdminPromoCodeDetailsRouteProps {
  params: Promise<{
    promoCodeId: string;
  }>;
}

export const dynamic = "force-dynamic";

const RELATED_ITEMS_LIMIT = "100";

export default async function Page({ params }: AdminPromoCodeDetailsRouteProps) {
  const { promoCodeId } = await params;
  const parsedPromoCodeId = Number(promoCodeId);

  if (!Number.isInteger(parsedPromoCodeId) || parsedPromoCodeId < 1) {
    notFound();
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("admin_access_token")?.value;

  if (!accessToken) {
    redirect(ROUTES.ADMIN_LOGIN);
  }

  try {
    const [promoCode, productsResponse, categoriesResponse] = await Promise.all([
      adminPromoCodeApi.getById(parsedPromoCodeId, accessToken),
      adminProductApi.getList({ limit: RELATED_ITEMS_LIMIT, page: "1" }, accessToken),
      adminCategoryApi.getList(
        { include_deleted: "false", limit: RELATED_ITEMS_LIMIT, page: "1" },
        accessToken,
      ),
    ]);

    return (
      <div className="space-y-8">
        <AdminPromoCodeDetailsView promoCode={promoCode} />
        <AdminPromoCodeFormView
          categories={categoriesResponse.items}
          products={productsResponse.items}
          promoCode={promoCode}
        />
      </div>
    );
  } catch {
    return (
      <section className="border-border bg-bg-primary shadow-soft rounded-lg border p-5 sm:p-6">
        <h1 className="text-text-primary text-2xl font-bold">Карточка промокода</h1>
        <p className="text-text-secondary mt-3 leading-7">
          Не удалось загрузить промокод. Обновите страницу или вернитесь к списку.
        </p>
      </section>
    );
  }
}
