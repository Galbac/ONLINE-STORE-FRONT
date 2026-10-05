"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getPushSubscription,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/shared/lib/push-notifications";
import { getStoredAccessToken } from "@/shared/ui";

export type PushPermissionStatus =
  | "loading"
  | "default"
  | "granted"
  | "denied"
  | "unsupported";

const STORAGE_BANNER_KEY = "grocery_push_banner_dismissed";

export interface UsePushNotificationsReturn {
  feedback: string | null;
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
  const [feedback, setFeedback] = useState<string | null>(null);
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

    const storedDismissal = localStorage.getItem(STORAGE_BANNER_KEY);
    const dismissedAt = storedDismissal === "true" ? Date.now() : Number(storedDismissal);
    if (storedDismissal === "true") localStorage.setItem(STORAGE_BANNER_KEY, String(dismissedAt));
    setIsBannerDismissed(
      Number.isFinite(dismissedAt) && dismissedAt > 0 && Date.now() - dismissedAt < 3 * 24 * 60 * 60 * 1000,
    );

    void (async () => {
      try {
        const sub = await getPushSubscription();
        setIsSubscribed(Boolean(sub));
      } catch {
        setIsSubscribed(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!isPushSupported()) return;
    const sync = () => {
      setPermission(Notification.permission);
      void getPushSubscription().then((subscription) => setIsSubscribed(Boolean(subscription)));
    };
    window.addEventListener("focus", sync);
    window.addEventListener("grocery-push-changed", sync);
    return () => { window.removeEventListener("focus", sync); window.removeEventListener("grocery-push-changed", sync); };
  }, []);

  const dismissBanner = useCallback(() => {
    setIsBannerDismissed(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_BANNER_KEY, String(Date.now()));
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined" || !isPushSupported()) {
      
      return false;
    }

    setFeedback(null);
    setIsLoading(true);
    try {
      const res = await subscribeToPush();
      const currentPermission = Notification.permission as PushPermissionStatus;
      setPermission(currentPermission);

      if (res.success) {
        setIsSubscribed(true);
        dismissBanner();
        setFeedback("Уведомления включены на этом устройстве.");
        return true;
      } else {
        setFeedback(res.error || "Не удалось включить уведомления.");
        return false;
      }
    } catch {
      setFeedback("Не удалось подключиться. Попробуйте ещё раз.");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [dismissBanner]);

  const togglePush = useCallback(async () => {
    if (typeof window === "undefined" || !isPushSupported()) return;

    setFeedback(null);
    setIsLoading(true);
    try {
      if (isSubscribed) {
        const ok = await unsubscribeFromPush();
        if (ok) {
          setIsSubscribed(false);
          setFeedback("Уведомления отключены на этом устройстве.");
        } else {
          setFeedback("Не удалось изменить подписку. Попробуйте ещё раз.");
        }
      } else {
        const res = await subscribeToPush();
        const currentPermission = Notification.permission as PushPermissionStatus;
        setPermission(currentPermission);
        if (res.success) {
          setIsSubscribed(true);
          dismissBanner();
          
        } else {
          setFeedback("Не удалось изменить подписку. Попробуйте ещё раз.");
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [isSubscribed, dismissBanner]);

  const sendTestPush = useCallback(async () => {
    setFeedback(null);
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
        setFeedback("Проверочное уведомление отправлено. Посмотрите уведомления на устройстве.");
      } else {
        setFeedback(data.message || "Не удалось отправить уведомление. Подключите уведомления повторно.");
      }
    } catch {
      setFeedback("Не удалось отправить уведомление. Проверьте подключение.");
    } finally {
      setIsTesting(false);
    }
  }, []);

  return {
    feedback,
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
