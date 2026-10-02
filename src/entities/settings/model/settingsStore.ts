"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { settingsApi } from "../api/settingsApi";
import type { PublicStoreSettingsResponse } from "../types";

export const SETTINGS_UPDATED_EVENT = "grocery_store_settings_updated";

export const notifySettingsUpdated = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(SETTINGS_UPDATED_EVENT));
  }
};

interface StoreSettingsState {
  settings: PublicStoreSettingsResponse | null;
  isLoading: boolean;
  lastFetchedAt: number | null;
  fetchSettings: (force?: boolean) => Promise<PublicStoreSettingsResponse | null>;
  setSettings: (settings: PublicStoreSettingsResponse) => void;
}

export const useStoreSettings = create<StoreSettingsState>()(
  persist(
    (set, get) => ({
      settings: null,
      isLoading: false,
      lastFetchedAt: null,

      fetchSettings: async (force = false) => {
        const now = Date.now();
        const { lastFetchedAt, isLoading, settings } = get();

        if (isLoading) return settings;
        if (!force && lastFetchedAt && now - lastFetchedAt < 5000 && settings) {
          return settings;
        }

        set({ isLoading: true });
        try {
          const fresh = await settingsApi.getPublicSettings();
          set({ settings: fresh, lastFetchedAt: Date.now(), isLoading: false });
          return fresh;
        } catch {
          set({ isLoading: false });
          return settings;
        }
      },

      setSettings: (fresh) => {
        set({ settings: fresh, lastFetchedAt: Date.now() });
      },
    }),
    {
      name: "grocery_store_public_settings",
      storage: createJSONStorage(() =>
        typeof window !== "undefined"
          ? localStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            },
      ),
    },
  ),
);
