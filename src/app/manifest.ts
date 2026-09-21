import type { MetadataRoute } from "next";

import { STORE_INFO } from "@/shared/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${STORE_INFO.name} — Доставка продуктов`,
    short_name: STORE_INFO.name,
    description: "Онлайн-супермаркет свежих продуктов с быстрой доставкой и самовывозом.",
    start_url: "/",
    id: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#059669",
    lang: "ru",
    categories: ["shopping", "food"],
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
