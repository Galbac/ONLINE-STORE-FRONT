import { CategoryPage } from "@/widgets/category";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    page?: string;
    limit?: string;
    in_stock?: string;
    sort?: "price_asc" | "price_desc" | "newest" | "popular" | "name_asc" | "name_desc";
  }>;
}

export default async function Page({ params, searchParams }: PageProps) {
  const [{ slug }, resolvedSearchParams] = await Promise.all([params, searchParams]);

  return <CategoryPage searchParams={resolvedSearchParams} slug={slug} />;
}
