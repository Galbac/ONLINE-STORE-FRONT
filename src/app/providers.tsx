"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
import { StoreSettingsProvider } from "@/entities/settings/model/StoreSettingsProvider";
import { PullToRefresh } from "@/shared/ui/pull-to-refresh";
import { BottomNav } from "@/widgets/bottom-nav";
import { ScrollRestorationKeeper } from "@/shared/ui/scroll-keeper";
import { CartDrawer } from "@/widgets/cart-drawer";
import { CookieBanner } from "@/shared/ui/cookie-banner";
import { PwaInstallPrompt, PwaInstallModal } from "@/shared/ui/pwa-install";
import { OfflineIndicator } from "@/shared/ui/offline-indicator";
import { PushPermissionPrompt } from "@/shared/ui/push-permission-prompt";

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps) => {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/register/") ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password";

  useEffect(() => {
    setMounted(true);

    if (
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ) {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker
          .getRegistrations()
          .then((regs) => {
            for (const r of regs) {
              r.unregister();
            }
          })
          .catch(() => {});
      }
      if ("caches" in window) {
        caches
          .keys()
          .then((keys) => {
            for (const k of keys) {
              caches.delete(k);
            }
          })
          .catch(() => {});
      }
    }
  }, []);

  return (
    <StoreSettingsProvider>
      <PullToRefresh>{children}</PullToRefresh>
      {!isAuthRoute && (
        <>
          <Toaster richColors position="top-center" closeButton />
          <BottomNav />
          <ScrollRestorationKeeper />
          <CartDrawer />
          <CookieBanner />
          <PushPermissionPrompt />
          {mounted && (
            <>
              <PwaInstallPrompt />
              <PwaInstallModal />
              <OfflineIndicator />
            </>
          )}
        </>
      )}
    </StoreSettingsProvider>
  );
};

export default AppProviders;
