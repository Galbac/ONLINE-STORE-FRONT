import type { AdminCategoryListItemResponse } from "@/entities/admin-category";
import type { AdminProductDetailResponse } from "@/entities/admin-product";
import { AdminProductEditForm } from "@/features/edit-admin-product";

interface AdminProductEditPageProps {
  categories: AdminCategoryListItemResponse[];
  product: AdminProductDetailResponse;
}

export const AdminProductEditPage = ({ categories, product }: AdminProductEditPageProps) => {
  return <AdminProductEditForm categories={categories} product={product} />;
};
