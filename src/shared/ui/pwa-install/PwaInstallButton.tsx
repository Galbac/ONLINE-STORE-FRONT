"use client";

import { useEffect, useState } from "react";
import { Download, Smartphone, Sparkles } from "lucide-react";
import { cn } from "@/shared/config";
import { toast } from "sonner";
import { isAppStandalone, isIosDevice, getGlobalDeferredPrompt, openPwaInstallModal, triggerInstallPrompt } from "@/shared/lib/pwa-install";

interface PwaInstallButtonProps {
  variant?: "card" | "compact" | "footer" | "header";
  className?: string;
}

export const PwaInstallButton = ({ variant = "compact", className }: PwaInstallButtonProps) => {
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsStandalone(isAppStandalone());
  }, []);

  if (isStandalone) {
    return null;
  }

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    // На Android при наличии prompt сразу вызываем нативную установку
    if (!isIosDevice() && getGlobalDeferredPrompt()) {
      const outcome = await triggerInstallPrompt();
      if (outcome === "accepted") {
        toast.success("Приложение успешно установлено на ваш телефон!");
        return;
      }
    }
    // На iPhone или если браузер еще не выдал prompt - открываем подробную инструкцию
    openPwaInstallModal();
  };

  if (variant === "card") {
    return (
      <section
        className={cn(
          "flex flex-col gap-4 rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-white p-5 shadow-sm transition-all hover:shadow-md sm:flex-row sm:items-center sm:justify-between sm:p-6",
          className,
        )}
      >
        <div className="flex items-start gap-4 sm:items-center">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-700/20 sm:size-14">
            <Smartphone size={26} />
          </span>
          <div>
            <div className="mb-0.5 inline-flex items-center gap-1 text-[11px] font-bold tracking-wider text-emerald-700 uppercase">
              <Sparkles size={12} />
              <span>Удобно для покупок</span>
            </div>
            <h3 className="text-base leading-tight font-black text-slate-900 sm:text-lg">
              Установить приложение на телефон
            </h3>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-600">
              Открывайте каталог и оформляйте заказы в 1 клик прямо с экрана телефона без адресной
              строки браузера.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClick}
          className="inline-flex h-12 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-xs font-black tracking-wider text-white uppercase shadow-md shadow-emerald-700/20 transition hover:bg-emerald-700 active:scale-95"
        >
          <Download size={16} />
          <span>Установить на телефон</span>
        </button>
      </section>
    );
  }

  if (variant === "footer") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "inline-flex cursor-pointer items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-2.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100 active:scale-95",
          className,
        )}
      >
        <Smartphone size={16} className="text-emerald-600" />
        <span>Установить приложение на телефон</span>
      </button>
    );
  }

  if (variant === "header") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 active:scale-95",
          className,
        )}
        title="Добавить приложение на экран телефона"
      >
        <Smartphone size={14} />
        <span className="hidden sm:inline">Приложение</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95",
        className,
      )}
    >
      <Download size={15} />
      <span>Установить приложение</span>
    </button>
  );
};
