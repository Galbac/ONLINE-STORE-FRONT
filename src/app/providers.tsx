"use client";

import React, { useState, useEffect, useRef } from "react";
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

const legalDocumentPaths = ["/offer", "/privacy", "/personal-data-consent", "/cookies"] as const;
const legalDocumentReturnPathKey = "grocery-legal-document-return-path";

const isLegalDocumentPath = (pathname: string): boolean => {
  return legalDocumentPaths.includes(pathname as (typeof legalDocumentPaths)[number]);
};

export const AppProviders = ({ children }: AppProvidersProps) => {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const previousPathnameRef = useRef(pathname);
  const previousHrefRef = useRef(
    typeof window === "undefined" ? pathname : `${window.location.pathname}${window.location.search}`,
  );
  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/register/") ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/personal-data-consent" ||
    pathname === "/privacy" ||
    pathname === "/offer" ||
    pathname === "/cookies";

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

  useEffect(() => {
    if (isLegalDocumentPath(pathname)) {
      if (!isLegalDocumentPath(previousPathnameRef.current)) {
        sessionStorage.setItem(legalDocumentReturnPathKey, previousHrefRef.current);
      } else if (!sessionStorage.getItem(legalDocumentReturnPathKey)) {
        try {
          const referrer = new URL(document.referrer);
          if (referrer.origin === window.location.origin && !isLegalDocumentPath(referrer.pathname)) {
            sessionStorage.setItem(
              legalDocumentReturnPathKey,
              `${referrer.pathname}${referrer.search}`,
            );
          }
        } catch {
          // A directly opened document falls back to the home page.
        }
      }
    } else {
      sessionStorage.removeItem(legalDocumentReturnPathKey);
    }

    previousPathnameRef.current = pathname;
    previousHrefRef.current = `${window.location.pathname}${window.location.search}`;
  }, [pathname]);

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
