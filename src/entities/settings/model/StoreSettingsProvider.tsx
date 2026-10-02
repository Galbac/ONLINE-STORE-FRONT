"use client";

import React, { createContext, useContext, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import type { PublicStoreSettingsResponse } from "../types";
import { STORE_INFO } from "@/shared/config/store";
import { formatPhoneMask } from "@/shared/lib/format/phone";
import { SETTINGS_UPDATED_EVENT, useStoreSettings } from "./settingsStore";

const StoreSettingsContext = createContext<PublicStoreSettingsResponse | null>(null);

export const StoreSettingsProvider = ({
  initialSettings,
  children,
}: {
  initialSettings?: PublicStoreSettingsResponse | null;
  children: React.ReactNode;
}) => {
  const isInitialized = useRef(false);
  const storeSettings = useStoreSettings((s) => s.settings);
  const fetchSettings = useStoreSettings((s) => s.fetchSettings);
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (!isInitialized.current && initialSettings) {
    if (!storeSettings) {
      useStoreSettings.setState({ settings: initialSettings, lastFetchedAt: Date.now() });
    }
    isInitialized.current = true;
  }

  useEffect(() => {
    void fetchSettings();

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

  const current = storeSettings || initialSettings || null;
  const isMaintenance = Boolean(current?.maintenance_mode);
  const statusText = current?.current_status_text || null;

  return (
    <StoreSettingsContext.Provider value={current}>
      {isMaintenance && !isAdmin && (
        <div className="sticky top-0 z-50 w-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-white shadow-md">
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2.5 text-center text-xs sm:text-sm font-bold">
            <AlertTriangle size={18} className="shrink-0 text-amber-100 animate-pulse" />
            <span>
              {statusText || "Магазин временно закрыт на техническое обслуживание"} • Онлайн-заказы временно приостановлены
            </span>
          </div>
        </div>
      )}
      {children}
    </StoreSettingsContext.Provider>
  );
};

export const useDynamicStoreInfo = () => {
  const contextSettings = useContext(StoreSettingsContext);
  const storeSettings = useStoreSettings((s) => s.settings);
  const settings = contextSettings || storeSettings;

  const name = (settings?.shop_name || STORE_INFO.name).trim();
  const rawPhone = (settings?.phone || STORE_INFO.phone).trim();
  const phone = formatPhoneMask(rawPhone);
  const phoneHref = `tel:${rawPhone.replace(/[^\d+]/g, "")}`;
  const email = (settings?.email || STORE_INFO.email).trim();
  const address = (settings?.address || STORE_INFO.address).trim();
  const city = (settings?.default_city || STORE_INFO.city).trim();
  const workingHours = (settings?.working_hours || STORE_INFO.workingHours).trim();
  const isMaintenance = Boolean(settings?.maintenance_mode);
  const isOpenNow = settings?.is_open_now ?? true;
  const statusText = settings?.current_status_text || null;
  const legalName = settings?.legal_name || STORE_INFO.legalName;
  const inn = settings?.inn || STORE_INFO.inn;
  const ogrn = settings?.ogrn || STORE_INFO.ogrn;
  const schedule = settings?.schedule || null;

  return {
    settings,
    name,
    phone,
    phoneHref,
    email,
    address,
    city,
    workingHours,
    isMaintenance,
    isOpenNow,
    statusText,
    legalName,
    inn,
    ogrn,
    schedule,
  };
};

export const SettingsSyncKeeper = () => null;

export default StoreSettingsProvider;
