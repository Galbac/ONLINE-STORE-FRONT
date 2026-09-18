import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { STORE_INFO } from "@/shared/config";
import { CookieBanner, PwaInstallPrompt } from "@/shared/ui";
import { BottomNav } from "@/widgets/bottom-nav";
import { CartDrawer } from "@/widgets/cart-drawer";
import { Toaster } from "sonner";

import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-inter",
});

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
    <html lang="ru" className={inter.variable}>
      <body className={`${inter.className} mobile-bottom-padding antialiased bg-slate-50/70 text-slate-900 selection:bg-emerald-500 selection:text-white`}>
        {children}
        <BottomNav />
        <CartDrawer />
        <Toaster position="bottom-right" richColors closeButton />
        <CookieBanner />
        <PwaInstallPrompt />
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
  themeColor: "#059669",
};
