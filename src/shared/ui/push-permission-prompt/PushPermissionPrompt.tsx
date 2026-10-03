"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { BellRing, X } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { getStoredAccessToken } from "@/shared/ui";
import { Button } from "@/shared/ui/button/Button";

export const PushPermissionPrompt = () => {
  const pathname = usePathname() || "";
  const [isAuth, setIsAuth] = useState(false);
  const lastSyncedToken = useRef<string | null>(null);
  const {
    permission,
    isLoading,
    isBannerDismissed,
    requestPermission,
    dismissBanner,
  } = usePushNotifications();

  useEffect(() => {
    const updateAuth = () => setIsAuth(Boolean(getStoredAccessToken()));
    updateAuth();
    window.addEventListener("grocery-auth-changed", updateAuth);
    window.addEventListener("focus", updateAuth);
    window.addEventListener("storage", updateAuth);
    return () => {
      window.removeEventListener("grocery-auth-changed", updateAuth);
      window.removeEventListener("focus", updateAuth);
      window.removeEventListener("storage", updateAuth);
    };
  }, []);

  useEffect(() => {
    const token = getStoredAccessToken();
    if (!isAuth || !token || permission !== "granted" || isLoading || lastSyncedToken.current === token) return;
    lastSyncedToken.current = token;
    void requestPermission();
  }, [isAuth, isLoading, permission, requestPermission]);

  if (
    !isAuth ||
    permission !== "default" ||
    isBannerDismissed ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/profile/notifications")
  ) {
    return null;
  }

  return (
    <aside
      aria-label="Включение push-уведомлений"
      className="fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[60] rounded-2xl border border-emerald-200 bg-white p-4 shadow-xl sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[min(26rem,calc(100vw-2.5rem))]"
    >
      <button
        type="button"
        onClick={dismissBanner}
        aria-label="Позже"
        className="absolute right-2 top-2 flex size-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
      >
        <X size={17} />
      </button>
      <div className="flex items-start gap-3 pr-6">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
          <BellRing size={20} />
        </span>
        <div>
          <p className="font-bold text-slate-900">Не пропускайте новости о заказе</p>
          <p className="mt-1 text-sm leading-5 text-slate-600">
            Сообщим об оплате, отмене, готовности и доставке заказа.
          </p>
        </div>
      </div>
      <Button
        onClick={() => void requestPermission()}
        disabled={isLoading}
        className="mt-4 min-h-11 w-full justify-center gap-2 bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
      >
        <BellRing size={16} />
        {isLoading ? "Подключаем…" : "Включить уведомления"}
      </Button>
      <p className="mt-2 text-center text-xs text-slate-500">
        Разрешение можно будет изменить в настройках браузера.
      </p>
    </aside>
  );
};
