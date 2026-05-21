import { ProductPage } from "@/widgets/product";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;

  return <ProductPage slug={slug} />;
}
