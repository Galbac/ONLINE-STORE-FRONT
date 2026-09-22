"use client";

import { useEffect, useState } from "react";
import { Bell, Download, HelpCircle, Smartphone, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { STORE_INFO } from "@/shared/config";
import { registerServiceWorker, subscribeToPush } from "@/shared/lib/push-notifications";
import {
  isAppStandalone,
  isIosDevice,
  openPwaInstallModal,
  setGlobalDeferredPrompt,
  triggerInstallPrompt,
  type BeforeInstallPromptEvent,
} from "@/shared/lib/pwa-install";
import { Button } from "../button/Button";

export const PwaInstallPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [hasPrompt, setHasPrompt] = useState(false);
  const [mode, setMode] = useState<"install" | "push">("install");
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    // 1. Всегда регистрируем Service Worker на клиенте
    void registerServiceWorker();

    // 2. Проверяем standalone (уже установлено)
    const standalone = isAppStandalone();
    const ios = isIosDevice();
    setIsIos(ios);

    if (standalone) {
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
    if (dismissedAt && Date.now() - Number(dismissedAt) < 3 * 24 * 60 * 60 * 1000) {
      return;
    }

    if (ios) {
      const timer = setTimeout(() => {
        setMode("install");
        setShowPrompt(true);
      }, 3500);
      return () => clearTimeout(timer);
    }

    // Android Chrome beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setGlobalDeferredPrompt(e as BeforeInstallPromptEvent);
      setHasPrompt(true);
      setMode("install");
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (isIos || !hasPrompt) {
      openPwaInstallModal();
      setShowPrompt(false);
      return;
    }

    const outcome = await triggerInstallPrompt();
    if (outcome === "accepted") {
      setShowPrompt(false);
      toast.success("Приложение успешно установлено!");
    } else if (outcome === "unsupported") {
      openPwaInstallModal();
      setShowPrompt(false);
    }
  };

  const handleOpenHelp = () => {
    openPwaInstallModal();
    setShowPrompt(false);
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
      className="animate-in slide-in-from-bottom-5 fixed right-3 bottom-20 left-3 z-40 mx-auto max-w-md duration-300 lg:right-6 lg:bottom-6 lg:left-auto"
    >
      <div className="relative overflow-hidden rounded-3xl border border-emerald-200/90 bg-white/98 p-4 shadow-2xl ring-1 ring-black/5 backdrop-blur-xl">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          type="button"
          aria-label="Закрыть"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-3 pr-6">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-700/20">
            {mode === "push" ? <Bell size={22} /> : <Smartphone size={24} />}
          </span>
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider text-emerald-700 uppercase">
              <Sparkles size={11} />
              <span>{mode === "push" ? "Уведомления" : "Быстрый доступ"}</span>
            </div>
            <h4 className="text-sm leading-tight font-black text-slate-900">
              {mode === "push" ? "Статус ваших заказов" : `Приложение ${STORE_INFO.name}`}
            </h4>
            <p className="mt-0.5 text-xs leading-normal text-slate-500">
              {mode === "push"
                ? "Узнавайте о сборке, выезде курьера и скидках первыми"
                : isIos
                  ? "Добавьте иконку магазина на экран телефона в 3 простых шага"
                  : "Установите на рабочий стол для быстрого заказа в 1 клик"}
            </p>
          </div>
        </div>

        <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
          <Button
            onClick={handleDismiss}
            variant="ghost"
            className="h-9 px-3 text-xs text-slate-400 hover:text-slate-600"
          >
            Позже
          </Button>

          <div className="flex items-center gap-2">
            {mode === "push" ? (
              <Button
                onClick={handleEnablePush}
                disabled={isSubscribing}
                className="h-9 gap-1.5 px-4 text-xs font-bold shadow-sm shadow-emerald-700/20"
              >
                <Bell size={13} /> {isSubscribing ? "Включение..." : "Включить"}
              </Button>
            ) : isIos ? (
              <Button
                onClick={handleOpenHelp}
                className="h-9 gap-1.5 px-4 text-xs font-bold shadow-sm shadow-emerald-700/20"
              >
                <HelpCircle size={14} /> Как добавить на экран
              </Button>
            ) : (
              <Button
                onClick={handleInstallClick}
                className="h-9 gap-1.5 px-4 text-xs font-bold shadow-sm shadow-emerald-700/20"
              >
                <Download size={14} /> Установить в 1 клик
              </Button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
