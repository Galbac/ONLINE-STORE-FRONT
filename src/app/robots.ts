import type { MetadataRoute } from "next";

const baseUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://eda-pobeda.ru"
).replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/catalog", "/catalog/*", "/product/*", "/offer", "/privacy", "/personal-data-consent"],
        disallow: [
          "/admin",
          "/admin/*",
          "/profile",
          "/profile/*",
          "/cart",
          "/checkout",
          "/checkout/*",
          "/login",
          "/register",
          "/reset-password",
          "/forgot-password",
          "/api/*",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
