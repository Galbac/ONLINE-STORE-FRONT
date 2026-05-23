import type { AdminCategoryListItemResponse } from "@/entities/admin-category";
import { AdminProductCreateForm } from "@/features/create-admin-product";

interface AdminProductCreatePageProps {
  categories: AdminCategoryListItemResponse[];
}

export const AdminProductCreatePage = ({ categories }: AdminProductCreatePageProps) => {
  return <AdminProductCreateForm categories={categories} />;
};
