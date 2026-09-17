import type { Metadata } from "next";

import { STORE_INFO } from "@/shared/config";
import { CookieBanner } from "@/shared/ui";
import { BottomNav } from "@/widgets/bottom-nav";

import "./globals.css";

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://localhost"
).replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${STORE_INFO.name} - свежесть каждый день`,
    template: `%s | ${STORE_INFO.name}`,
  },
  description: "Онлайн-магазин свежих продуктов с быстрой доставкой и самовывозом.",
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: STORE_INFO.name,
  },
  openGraph: {
    title: `${STORE_INFO.name} - свежесть каждый день`,
    description: "Онлайн-магазин свежих продуктов с быстрой доставкой и самовывозом.",
    url: siteUrl,
    siteName: STORE_INFO.name,
    locale: "ru_RU",
    type: "website",
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ru">
      <body className="mobile-bottom-padding">
        {children}
        <BottomNav />
        <CookieBanner />
      </body>
    </html>
  );
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#15910d",
};
