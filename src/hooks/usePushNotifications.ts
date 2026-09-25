"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getPushSubscription,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/shared/lib/push-notifications";
import { getStoredAccessToken } from "@/shared/ui";
import { toast } from "sonner";

export type PushPermissionStatus =
  | "loading"
  | "default"
  | "granted"
  | "denied"
  | "unsupported";

const STORAGE_BANNER_KEY = "grocery_push_banner_dismissed";

export interface UsePushNotificationsReturn {
  permission: PushPermissionStatus;
  isSubscribed: boolean;
  isLoading: boolean;
  isTesting: boolean;
  isBannerDismissed: boolean;
  requestPermission: () => Promise<boolean>;
  togglePush: () => Promise<void>;
  sendTestPush: () => Promise<void>;
  dismissBanner: () => void;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [permission, setPermission] = useState<PushPermissionStatus>("loading");
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(true); // Безопасно для SSR

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!isPushSupported()) {
      setPermission("unsupported");
      return;
    }

    const currentPermission = Notification.permission as PushPermissionStatus;
    setPermission(currentPermission);

    const dismissed = localStorage.getItem(STORAGE_BANNER_KEY) === "true";
    setIsBannerDismissed(dismissed);

    void (async () => {
      try {
        const sub = await getPushSubscription();
        setIsSubscribed(Boolean(sub));
      } catch {
        setIsSubscribed(false);
      }
    })();
  }, []);

  const dismissBanner = useCallback(() => {
    setIsBannerDismissed(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_BANNER_KEY, "true");
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined" || !isPushSupported()) {
      toast.error("Push-уведомления не поддерживаются в вашем браузере");
      return false;
    }

    setIsLoading(true);
    try {
      const res = await subscribeToPush();
      const currentPermission = Notification.permission as PushPermissionStatus;
      setPermission(currentPermission);

      if (res.success) {
        setIsSubscribed(true);
        dismissBanner();
        toast.success("Push-уведомления успешно подключены!");
        return true;
      } else {
        toast.error(res.error || "Не удалось подключить уведомления");
        return false;
      }
    } catch {
      toast.error("Ошибка при запросе разрешения на push-уведомления");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [dismissBanner]);

  const togglePush = useCallback(async () => {
    if (typeof window === "undefined" || !isPushSupported()) return;

    setIsLoading(true);
    try {
      if (isSubscribed) {
        const ok = await unsubscribeFromPush();
        if (ok) {
          setIsSubscribed(false);
          toast.info("Push-уведомления отключены");
        } else {
          toast.error("Не удалось отключить push-уведомления");
        }
      } else {
        const res = await subscribeToPush();
        const currentPermission = Notification.permission as PushPermissionStatus;
        setPermission(currentPermission);
        if (res.success) {
          setIsSubscribed(true);
          dismissBanner();
          toast.success("Push-уведомления успешно подключены!");
        } else {
          toast.error(res.error || "Не удалось подключить push-уведомления");
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [isSubscribed, dismissBanner]);

  const sendTestPush = useCallback(async () => {
    setIsTesting(true);
    try {
      const accessToken = getStoredAccessToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(apiUrl + "/api/notifications/push/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: accessToken ? "Bearer " + accessToken : "",
        },
        body: JSON.stringify({
          title: "Проверка уведомлений 🔔",
          body: "Push-уведомления работают отлично! Вы будете узнавать о доставке первыми.",
          url: "/profile/notifications",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Тестовое уведомление отправлено!");
      } else {
        toast.error(data.detail || data.message || "Ошибка отправки тестового уведомления");
      }
    } catch {
      toast.error("Не удалось отправить тестовое уведомление");
    } finally {
      setIsTesting(false);
    }
  }, []);

  return {
    permission,
    isSubscribed,
    isLoading,
    isTesting,
    isBannerDismissed,
    requestPermission,
    togglePush,
    sendTestPush,
    dismissBanner,
  };
}
