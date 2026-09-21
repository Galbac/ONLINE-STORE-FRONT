"use client";

import { useEffect, useState } from "react";
import { Bell, Download, Share, Sparkles, X } from "lucide-react";
import { STORE_INFO } from "@/shared/config";
import { registerServiceWorker, subscribeToPush } from "@/shared/lib/push-notifications";
import { Button } from "../button/Button";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const PwaInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [mode, setMode] = useState<"install" | "push">("install");
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    // 1. Всегда регистрируем Service Worker на клиенте
    void registerServiceWorker();

    // 2. Проверяем, запущено ли приложение как PWA (standalone)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone;

    // Определение iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    if (isStandalone) {
      // Если уже установлено как приложение, проверяем статус Push
      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "default") {
          const pushDismissed = localStorage.getItem("push_prompt_dismissed");
          if (!pushDismissed || Date.now() - Number(pushDismissed) > 3 * 24 * 60 * 60 * 1000) {
            setMode("push");
            const timer = setTimeout(() => setShowPrompt(true), 2500);
            return () => clearTimeout(timer);
          }
        }
      }
      return;
    }

    // Проверяем, закрывал ли пользователь баннер установки недавно
    const dismissedAt = localStorage.getItem("pwa_dismissed");
    if (dismissedAt && Date.now() - Number(dismissedAt) < 7 * 24 * 60 * 60 * 1000) {
      return;
    }

    if (isIosDevice) {
      const timer = setTimeout(() => {
        setMode("install");
        setShowPrompt(true);
      }, 4000);
      return () => clearTimeout(timer);
    }

    // Android Chrome beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setMode("install");
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
  };

  const handleEnablePush = async () => {
    try {
      setIsSubscribing(true);
      const res = await subscribeToPush();
      if (res.success) {
        toast.success("Уведомления успешно подключены!");
        setShowPrompt(false);
      } else {
        toast.error(res.error || "Не удалось включить уведомления");
      }
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    if (mode === "push") {
      localStorage.setItem("push_prompt_dismissed", String(Date.now()));
    } else {
      localStorage.setItem("pwa_dismissed", String(Date.now()));
    }
  };

  if (!showPrompt) return null;

  return (
    <aside
      aria-label={mode === "push" ? "Включение уведомлений" : "Установка приложения"}
      className="fixed bottom-20 left-3 right-3 z-50 mx-auto max-w-md animate-in slide-in-from-bottom-5 duration-300 lg:bottom-6 lg:right-6 lg:left-auto"
    >
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white/95 p-4 shadow-2xl backdrop-blur-xl ring-1 ring-black/5">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 flex size-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          type="button"
          aria-label="Закрыть"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-3 pr-6">
          <span className="flex size-11 sm:size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-700 to-teal-500 text-white shadow-md shadow-emerald-700/20">
            {mode === "push" ? <Bell size={22} /> : <Sparkles size={22} />}
          </span>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
              {mode === "push" ? "Уведомления о статусе заказов" : `Приложение ${STORE_INFO.name}`}
            </h4>
            <p className="mt-0.5 text-[11px] sm:text-xs text-slate-500 leading-normal">
              {mode === "push"
                ? "Узнавайте первыми о сборке, выезде курьера и поступлении любимых продуктов"
                : isIos
                  ? "Нажмите «Поделиться» ➔ «На экран Домой» для запуска как приложение"
                  : "Быстрый заказ продуктов в 1 клик прямо с экрана вашего телефона"}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button onClick={handleDismiss} variant="ghost" className="h-8 sm:h-9 px-2.5 sm:px-3 text-xs text-slate-500">
            Позже
          </Button>
          {mode === "push" ? (
            <Button
              onClick={handleEnablePush}
              disabled={isSubscribing}
              className="h-8 sm:h-9 px-3.5 sm:px-4 text-xs font-bold gap-1.5 shadow-sm shadow-emerald-700/20"
            >
              <Bell size={13} /> {isSubscribing ? "Включение..." : "Включить"}
            </Button>
          ) : isIos ? (
            <span className="inline-flex h-8 sm:h-9 items-center gap-1.5 rounded-xl bg-emerald-50 px-3 text-[11px] sm:text-xs font-bold text-emerald-700">
              <Share size={13} /> Поделиться ➔ Домой
            </span>
          ) : (
            <Button onClick={handleInstallClick} className="h-8 sm:h-9 px-3.5 sm:px-4 text-xs font-bold gap-1.5 shadow-sm shadow-emerald-700/20">
              <Download size={13} /> Установить
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
};
