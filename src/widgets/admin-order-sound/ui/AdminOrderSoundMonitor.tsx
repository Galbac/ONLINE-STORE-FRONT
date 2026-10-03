"use client";

import { useEffect } from "react";
import { adminNotificationApi } from "@/entities/admin-notification";
import { adminOrderApi } from "@/entities/admin-order";
import {
  ADMIN_ORDER_SOUND_SETTINGS_CHANGED_EVENT,
  playAdminOrderSound,
  type AdminOrderSoundSettings,
} from "@/shared/lib/admin-order-sound";
import { getStoredAdminAccessToken } from "@/shared/api";

const DEFAULT_SETTINGS: AdminOrderSoundSettings = { enabled: true, volume: 0.5 };

export const AdminOrderSoundMonitor = () => {
  useEffect(() => {
    let active = true;
    let isChecking = false;
    let initialized = false;
    let latestOrderId: number | null = null;
    let soundSettings = DEFAULT_SETTINGS;
    let soundSettingsLoadedAt = 0;

    const loadSoundSettings = async (token: string) => {
      try {
        const settings = await adminNotificationApi.getSettings(token);
        if (active) {
          soundSettings = {
            enabled: settings.admin_order_sound_enabled,
            volume: settings.admin_order_sound_volume,
          };
        }
      } catch {
        // If settings cannot be loaded, keep the default alert enabled.
      } finally {
        soundSettingsLoadedAt = Date.now();
      }
    };
    const initialToken = getStoredAdminAccessToken();
    const soundSettingsPromise = initialToken
      ? loadSoundSettings(initialToken)
      : Promise.resolve();

    const checkForNewOrders = async () => {
      if (!active || isChecking || document.visibilityState === "hidden") return;
      isChecking = true;
      try {
        await soundSettingsPromise;
        if (!active) return;
        const token = getStoredAdminAccessToken();
        if (!token) return;
        if (Date.now() - soundSettingsLoadedAt >= 60_000) {
          await loadSoundSettings(token);
        }
        if (!active) return;
        const response = await adminOrderApi.getList({ page: "1", limit: "1" }, token);
        if (!active) return;
        const newestOrderId = response.items[0]?.id;
        if (newestOrderId === undefined) return;

        if (initialized && newestOrderId !== latestOrderId && soundSettings.enabled) {
          playAdminOrderSound(soundSettings.volume);
        }
        latestOrderId = newestOrderId;
        initialized = true;
      } catch {
        // A failed background check should not interrupt admin work.
      } finally {
        isChecking = false;
      }
    };

    const handleSettingsChanged = (event: Event) => {
      const detail = (event as CustomEvent<AdminOrderSoundSettings>).detail;
      if (detail && typeof detail.enabled === "boolean" && Number.isFinite(detail.volume)) {
        soundSettings = { enabled: detail.enabled, volume: Math.min(1, Math.max(0, detail.volume)) };
      }
    };

    void checkForNewOrders();
    const interval = window.setInterval(checkForNewOrders, 15_000);
    window.addEventListener("focus", checkForNewOrders);
    document.addEventListener("visibilitychange", checkForNewOrders);
    window.addEventListener(ADMIN_ORDER_SOUND_SETTINGS_CHANGED_EVENT, handleSettingsChanged);

    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", checkForNewOrders);
      document.removeEventListener("visibilitychange", checkForNewOrders);
      window.removeEventListener(ADMIN_ORDER_SOUND_SETTINGS_CHANGED_EVENT, handleSettingsChanged);
    };
  }, []);

  return null;
};
