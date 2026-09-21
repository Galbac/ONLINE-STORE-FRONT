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
    const reg = await navigator.serviceWorker.ready;
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
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { success: false, error: "Доступ к уведомлениям отклонен пользователем" };
    }

    const reg = await navigator.serviceWorker.ready;
    let subscription = await reg.pushManager.getSubscription();

    if (!subscription) {
      // 1. Получаем публичный VAPID ключ с бэкенда
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const resKey = await fetch(`${apiUrl}/api/notifications/push/vapid-public-key`);
      if (!resKey.ok) {
        throw new Error("Не удалось получить открытый ключ VAPID");
      }
      const { public_key } = await resKey.json();

      // 2. Подписываемся в браузере
      const applicationServerKey = urlBase64ToUint8Array(public_key);
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as unknown as BufferSource,
      });
    }

    // 3. Отправляем ключи на наш сервер
    const subJson = subscription.toJSON();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
    const saveRes = await fetch(`${apiUrl}/api/notifications/push/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subJson.keys?.p256dh || "",
          auth: subJson.keys?.auth || "",
        },
        user_agent: navigator.userAgent,
      }),
    });

    if (!saveRes.ok) {
      throw new Error("Не удалось зарегистрировать подписку на сервере");
    }

    return { success: true };
  } catch (error: any) {
    console.error("Push subscribe error:", error);
    return { success: false, error: error.message || "Ошибка подключения пуш-уведомлений" };
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      await fetch(`${apiUrl}/api/notifications/push/unsubscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint }),
      });
    }
    return true;
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return false;
  }
}
