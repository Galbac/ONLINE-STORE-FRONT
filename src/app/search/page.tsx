import { SearchPage } from "@/widgets/search";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
    limit?: string;
    category_id?: string;
    in_stock?: string;
    has_discount?: string;
    sort?: "relevance" | "price_asc" | "price_desc" | "newest" | "popular";
  }>;
}

export default async function Page({ searchParams }: PageProps) {
  return <SearchPage searchParams={await searchParams} />;
}
