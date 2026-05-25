import { CatalogPage } from "@/widgets/catalog";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    category_id?: string;
    in_stock?: string;
    has_discount?: string;
    min_price?: string;
    max_price?: string;
    sort?: "price_asc" | "price_desc" | "newest" | "popular" | "name_asc" | "name_desc";
  }>;
}

export default async function Page({ searchParams }: PageProps) {
  return <CatalogPage searchParams={await searchParams} />;
}
