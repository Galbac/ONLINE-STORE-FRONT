import type { AdminCategoryListItemResponse } from "@/entities/admin-category";
import { AdminCategoriesView } from "./AdminCategoriesView";

interface AdminCategoriesPageProps {
  categories: AdminCategoryListItemResponse[];
}

export const AdminCategoriesPage = ({ categories }: AdminCategoriesPageProps) => {
  return <AdminCategoriesView initialCategories={categories} />;
};
