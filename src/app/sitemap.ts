import type { MetadataRoute } from "next";

import { categoryApi } from "@/entities/category";
import { productApi } from "@/entities/product";

const baseUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://eda-pobeda.ru"
).replace(/\/$/, "");

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/catalog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/offer`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/personal-data-consent`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  try {
    const [categoriesResult, productsResult] = await Promise.allSettled([
      categoryApi.getList(),
      productApi.getList({ page: 1, limit: 100 }),
    ]);

    const categoryRoutes: MetadataRoute.Sitemap =
      categoriesResult.status === "fulfilled"
        ? categoriesResult.value.items.map((category) => ({
            url: `${baseUrl}/catalog/${category.slug}`,
            lastModified: new Date(),
            changeFrequency: "weekly" as const,
            priority: 0.8,
          }))
        : [];

    const productRoutes: MetadataRoute.Sitemap =
      productsResult.status === "fulfilled"
        ? productsResult.value.items.map((product) => ({
            url: `${baseUrl}/product/${product.slug}`,
            lastModified: product.created_at ? new Date(product.created_at) : new Date(),
            changeFrequency: "weekly" as const,
            priority: 0.7,
          }))
        : [];

    return [...staticRoutes, ...categoryRoutes, ...productRoutes];
  } catch {
    return staticRoutes;
  }
}
