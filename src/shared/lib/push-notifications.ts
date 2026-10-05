import { apiClient, ensureAccessToken } from "@/shared/api/client";

// Web Push & PWA utilities

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    return registration;
  } catch (err) {
    console.warn("Failed to register Service Worker:", err);
    return null;
  }
}

export function isPushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export async function getPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.getRegistration("/");
    if (!reg) return null;
    return await reg.pushManager.getSubscription();
  } catch {
    return null;
  }
}

export async function subscribeToPush(): Promise<{ success: boolean; error?: string }> {
  if (!isPushSupported()) {
    return { success: false, error: "Уведомления не поддерживаются вашим браузером" };
  }

  try {
    await ensureAccessToken();
    const permission =
      Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (permission !== "granted") {
      return { success: false, error: "Доступ к уведомлениям отклонен пользователем" };
    }

    const registration = await registerServiceWorker();
    if (!registration) {
      throw new Error("Не удалось зарегистрировать Service Worker для push-уведомлений");
    }
    const reg = await navigator.serviceWorker.ready;
    let subscription = await reg.pushManager.getSubscription();

    if (!subscription) {
      // 1. Получаем публичный VAPID ключ с бэкенда
      const { public_key } = await apiClient.get<{ public_key: string }>(
        "/api/notifications/push/vapid-public-key",
      );
      if (!public_key) throw new Error("Уведомления пока недоступны");

      // 2. Подписываемся в браузере
      const applicationServerKey = urlBase64ToUint8Array(public_key);
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as unknown as BufferSource,
      });
    }

    // 3. Отправляем ключи на наш сервер
    const subJson = subscription.toJSON();
    await apiClient.post("/api/notifications/push/subscribe", {
      endpoint: subscription.endpoint,
      keys: { p256dh: subJson.keys?.p256dh || "", auth: subJson.keys?.auth || "" },
      user_agent: navigator.userAgent,
    });
    const status = await apiClient.get<{ enabled: boolean; is_subscribed: boolean }>(
      "/api/notifications/push/status",
      { endpoint: subscription.endpoint },
    );
    if (!status.enabled || !status.is_subscribed)
      throw new Error("Отправка уведомлений пока недоступна. Попробуйте позже.");

    window.dispatchEvent(new Event("grocery-push-changed"));
    return { success: true };
  } catch (error: unknown) {
    console.error("Push subscribe error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Ошибка подключения уведомлений",
    };
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.getRegistration("/");
    if (!reg) return true;
    const subscription = await reg.pushManager.getSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;
      const removed = await subscription.unsubscribe();
      if (!removed) return false;

      const { getStoredAccessToken, getStoredRefreshToken } =
        await import("@/shared/ui/auth-guard");
      if (getStoredAccessToken() || getStoredRefreshToken())
        await apiClient.post("/api/notifications/push/unsubscribe", { endpoint });
    }
    return true;
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return false;
  } finally {
    window.dispatchEvent(new Event("grocery-push-changed"));
  }
}

export async function isPushSubscribedForAccount(): Promise<boolean> {
  const subscription = await getPushSubscription();
  if (!subscription || Notification.permission !== "granted") return false;
  const { getStoredAccessToken, getStoredRefreshToken } = await import("@/shared/ui/auth-guard");
  if (!getStoredAccessToken() && !getStoredRefreshToken()) return false;
  await ensureAccessToken();
  const status = await apiClient.get<{ enabled: boolean; is_subscribed: boolean }>(
    "/api/notifications/push/status",
    { endpoint: subscription.endpoint },
  );
  return status.enabled && status.is_subscribed;
}
