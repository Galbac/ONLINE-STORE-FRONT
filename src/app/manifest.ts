import type { MetadataRoute } from "next";

import { STORE_INFO } from "@/shared/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${STORE_INFO.name} — Доставка продуктов`,
    short_name: STORE_INFO.name,
    description: "Онлайн-супермаркет свежих продуктов с быстрой доставкой и самовывозом.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#059669",
    lang: "ru",
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
