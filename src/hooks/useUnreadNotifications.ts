"use client";

import { useEffect, useState } from "react";
import { notificationApi } from "@/entities/notification";
import { getStoredAccessToken } from "@/shared/ui";

export const useUnreadNotifications = (): number => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let active = true;
    let loading = false;

    const load = async () => {
      if (loading || document.visibilityState === "hidden") return;
      const token = getStoredAccessToken();
      if (!token) {
        setUnreadCount(0);
        return;
      }
      loading = true;
      try {
        const result = await notificationApi.getUnreadCount(token);
        if (active && token === getStoredAccessToken()) setUnreadCount(result.unread_count);
      } catch {
        if (active) setUnreadCount(0);
      } finally {
        loading = false;
      }
    };

    const clear = () => setUnreadCount(0);
    void load();
    const timer = window.setInterval(load, 30_000);
    window.addEventListener("focus", load);
    window.addEventListener("grocery-auth-changed", load);
    document.addEventListener("visibilitychange", load);
    window.addEventListener("customer-notifications-read", clear);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", load);
      window.removeEventListener("grocery-auth-changed", load);
      document.removeEventListener("visibilitychange", load);
      window.removeEventListener("customer-notifications-read", clear);
    };
  }, []);

  return unreadCount;
};
