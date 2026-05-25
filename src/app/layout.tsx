import type { Metadata } from "next";

import { STORE_INFO } from "@/shared/config";

import "./globals.css";

export const metadata: Metadata = {
  title: `${STORE_INFO.name} - свежесть каждый день`,
  description: "Онлайн-магазин свежих продуктов с доставкой и самовывозом.",
  icons: {
    icon: "/favicon.svg",
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
