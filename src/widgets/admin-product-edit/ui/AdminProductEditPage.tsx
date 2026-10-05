import type { AdminCategoryListItemResponse } from "@/entities/admin-category";
import type { AdminProductDetailResponse } from "@/entities/admin-product";
import { AdminProductEditForm, AdminProductStores } from "@/features/edit-admin-product";

interface AdminProductEditPageProps {
  categories: AdminCategoryListItemResponse[];
  product: AdminProductDetailResponse;
}

export const AdminProductEditPage = ({ categories, product }: AdminProductEditPageProps) => {
  return (
    <div className="space-y-6">
      <AdminProductEditForm categories={categories} product={product} />
      <AdminProductStores productId={product.id} />
    </div>
  );
};
