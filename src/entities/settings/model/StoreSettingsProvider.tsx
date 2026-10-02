"use client";

import React, { createContext, useContext, useEffect, useRef } from "react";
import type { PublicStoreSettingsResponse } from "../types";
import { STORE_INFO } from "@/shared/config/store";
import { useStoreSettings } from "./settingsStore";

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

  if (!isInitialized.current && initialSettings) {
    if (!storeSettings) {
      useStoreSettings.setState({ settings: initialSettings, lastFetchedAt: Date.now() });
    }
    isInitialized.current = true;
  }

  useEffect(() => {
    void useStoreSettings.getState().fetchSettings();
  }, []);

  const current = storeSettings || initialSettings || null;

  return (
    <StoreSettingsContext.Provider value={current}>
      {children}
    </StoreSettingsContext.Provider>
  );
};

export const useDynamicStoreInfo = () => {
  const contextSettings = useContext(StoreSettingsContext);
  const storeSettings = useStoreSettings((s) => s.settings);
  const settings = contextSettings || storeSettings;

  const name = (settings?.shop_name || STORE_INFO.name).trim();
  const phone = (settings?.phone || STORE_INFO.phone).trim();
  const phoneHref = `tel:${phone.replace(/[^\d+]/g, "")}`;
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
