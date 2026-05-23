import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { adminCategoryApi } from "@/entities/admin-category";
import { adminProductApi } from "@/entities/admin-product";
import { ROUTES } from "@/shared/config";
import { AdminProductEditPage } from "@/widgets/admin-product-edit";

interface AdminProductEditRouteProps {
  params: Promise<{
    productId: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function Page({ params }: AdminProductEditRouteProps) {
  const { productId } = await params;
  const parsedProductId = Number(productId);

  if (!Number.isInteger(parsedProductId) || parsedProductId < 1) {
    notFound();
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("admin_access_token")?.value;

  if (!accessToken) {
    redirect(ROUTES.ADMIN_LOGIN);
  }

  try {
    const [product, categories] = await Promise.all([
      adminProductApi.getById(parsedProductId, accessToken),
      adminCategoryApi.getList(
        {
          include_deleted: "false",
          limit: "100",
          page: "1",
        },
        accessToken,
      ),
    ]);

    return <AdminProductEditPage categories={categories.items} product={product} />;
  } catch {
    return (
      <section className="border-border bg-bg-primary rounded-lg border p-5 shadow-soft sm:p-6">
        <h1 className="text-2xl font-bold text-text-primary">Редактирование товара</h1>
        <p className="text-text-secondary mt-3 leading-7">
          Не удалось загрузить товар. Обновите страницу или вернитесь к списку.
        </p>
      </section>
    );
  }
}
