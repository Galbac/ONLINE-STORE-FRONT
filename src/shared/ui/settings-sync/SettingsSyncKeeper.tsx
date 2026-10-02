"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import {
  SETTINGS_UPDATED_EVENT,
  useStoreSettings,
} from "@/entities/settings/model/settingsStore";
import { useDynamicStoreInfo } from "@/entities/settings/model/StoreSettingsProvider";

export const SettingsSyncKeeper = () => {
  const fetchSettings = useStoreSettings((s) => s.fetchSettings);
  const { isMaintenance, statusText } = useDynamicStoreInfo();
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  useEffect(() => {
    // Initial fetch on mount
    void fetchSettings();

    // Listen to settings update events (e.g. from admin panel)
    const handleSettingsUpdated = () => {
      void fetchSettings(true);
    };

    window.addEventListener(SETTINGS_UPDATED_EVENT, handleSettingsUpdated);
    window.addEventListener("focus", handleSettingsUpdated);

    return () => {
      window.removeEventListener(SETTINGS_UPDATED_EVENT, handleSettingsUpdated);
      window.removeEventListener("focus", handleSettingsUpdated);
    };
  }, [fetchSettings]);

  // Don't show maintenance banner on admin panel pages
  if (!isMaintenance || isAdmin) {
    return null;
  }

  return (
    <div className="sticky top-0 z-50 w-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-white shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2.5 text-center text-xs sm:text-sm font-bold">
        <AlertTriangle size={18} className="shrink-0 text-amber-100 animate-pulse" />
        <span>
          {statusText || "Магазин временно закрыт на техническое обслуживание"} • Онлайн-заказы временно приостановлены
        </span>
      </div>
    </div>
  );
};
