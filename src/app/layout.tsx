import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { STORE_INFO } from "@/shared/config";
import { CookieBanner, PwaInstallPrompt, PwaInstallModal } from "@/shared/ui";
import { OfflineIndicator } from "@/shared/ui/offline-indicator";
import { PullToRefresh } from "@/shared/ui/pull-to-refresh";
import { BottomNav } from "@/widgets/bottom-nav";
import { CartDrawer } from "@/widgets/cart-drawer";
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
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: STORE_INFO.name,
  },
  formatDetection: {
    telephone: false,
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
      <body
        className={`${inter.className} mobile-bottom-padding bg-slate-50/70 text-slate-900 antialiased selection:bg-emerald-500 selection:text-white`}
      >
        <PullToRefresh>{children}</PullToRefresh>
        <BottomNav />
        <CartDrawer />
        <Toaster position="bottom-right" richColors closeButton />
        <CookieBanner />
        <PwaInstallPrompt />
        <PwaInstallModal />
        <OfflineIndicator />
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
