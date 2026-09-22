"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  CheckCircle2,
  Download,
  PlusSquare,
  Share,
  Smartphone,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { STORE_INFO } from "@/shared/config";
import {
  getGlobalDeferredPrompt,
  isAppStandalone,
  isIosDevice,
  PWA_OPEN_INSTALL_MODAL,
  triggerInstallPrompt,
} from "@/shared/lib/pwa-install";
import { Button } from "../button/Button";

export const PwaInstallModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [hasPrompt, setHasPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    setIsIos(isIosDevice());
    setIsStandalone(isAppStandalone());
    setHasPrompt(Boolean(getGlobalDeferredPrompt()));

    const handleOpen = () => {
      setIsIos(isIosDevice());
      setIsStandalone(isAppStandalone());
      setHasPrompt(Boolean(getGlobalDeferredPrompt()));
      setIsOpen(true);
    };

    window.addEventListener(PWA_OPEN_INSTALL_MODAL, handleOpen);
    return () => window.removeEventListener(PWA_OPEN_INSTALL_MODAL, handleOpen);
  }, []);

  const handleInstallClick = async () => {
    try {
      setIsInstalling(true);
      const result = await triggerInstallPrompt();
      if (result === "accepted") {
        toast.success("Приложение успешно установлено на ваш телефон!");
        setIsOpen(false);
      } else if (result === "dismissed") {
        toast.info("Вы можете установить приложение в любое удобное время.");
      }
    } finally {
      setIsInstalling(false);
      setHasPrompt(Boolean(getGlobalDeferredPrompt()));
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="animate-in fade-in fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm duration-200 sm:items-center sm:p-4"
      onClick={() => setIsOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-modal-title"
    >
      <div
        className="animate-in slide-in-from-bottom-6 sm:zoom-in-95 relative w-full max-w-lg overflow-hidden rounded-t-3xl border border-slate-200 bg-white p-6 shadow-2xl duration-200 sm:rounded-3xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Кнопка закрытия */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          type="button"
          aria-label="Закрыть подсказку"
        >
          <X size={20} />
        </button>

        {/* Заголовок с иконкой приложения */}
        <div className="flex items-center gap-4">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50 p-2 shadow-sm">
            <Image
              src="/icons/icon-192x192.png"
              alt={STORE_INFO.name}
              width={64}
              height={64}
              className="size-full object-contain"
            />
          </div>
          <div>
            <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
              <Sparkles size={12} />
              <span>Быстро и бесплатно</span>
            </div>
            <h3 id="pwa-modal-title" className="text-xl leading-snug font-black text-slate-900">
              Приложение {STORE_INFO.name}
            </h3>
            <p className="text-xs text-slate-500">
              {isStandalone ? "Уже установлено на телефоне" : "Добавьте магазин на главный экран"}
            </p>
          </div>
        </div>

        {/* Если уже установлено в режиме приложения */}
        {isStandalone ? (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs font-semibold text-emerald-800">
              <CheckCircle2 size={24} className="shrink-0 text-emerald-600" />
              <span>Приложение уже установлено и работает на вашем устройстве!</span>
            </div>
            <Button onClick={() => setIsOpen(false)} className="h-12 w-full">
              Понятно, закрыть
            </Button>
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            {/* Преимущества */}
            <div className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-center">
              <div className="space-y-1">
                <span className="inline-flex size-7 items-center justify-center rounded-lg bg-emerald-100 text-xs font-bold text-emerald-700">
                  <Zap size={14} />
                </span>
                <p className="text-[11px] font-bold text-slate-800">1 клик</p>
                <p className="text-[9px] leading-tight text-slate-500">Быстрый вход</p>
              </div>
              <div className="space-y-1">
                <span className="inline-flex size-7 items-center justify-center rounded-lg bg-emerald-100 text-xs font-bold text-emerald-700">
                  <Smartphone size={14} />
                </span>
                <p className="text-[11px] font-bold text-slate-800">Без браузера</p>
                <p className="text-[9px] leading-tight text-slate-500">Как приложение</p>
              </div>
              <div className="space-y-1">
                <span className="inline-flex size-7 items-center justify-center rounded-lg bg-emerald-100 text-xs font-bold text-emerald-700">
                  <Sparkles size={14} />
                </span>
                <p className="text-[11px] font-bold text-slate-800">Бонусы</p>
                <p className="text-[9px] leading-tight text-slate-500">Кэшбэк 5%</p>
              </div>
            </div>

            {/* Сценарий 1: Android с кнопкой в 1 клик */}
            {hasPrompt && !isIos ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  disabled={isInstalling}
                  className="flex h-14 w-full cursor-pointer items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 text-sm font-extrabold tracking-wide text-white uppercase shadow-xl shadow-emerald-600/25 transition-all hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] disabled:opacity-60"
                >
                  <Download size={20} className="animate-bounce" />
                  <span>{isInstalling ? "Устанавливаем..." : "Установить в 1 нажатие"}</span>
                </button>
                <p className="text-center text-[11px] leading-relaxed text-slate-500">
                  Телефон покажет вопрос «Добавить на главный экран?». Нажмите{" "}
                  <strong>«Добавить»</strong>.
                </p>
              </div>
            ) : isIos ? (
              /* Сценарий 2: iPhone / iPad (Safari) */
              <div className="space-y-3.5 rounded-2xl border border-emerald-200/80 bg-gradient-to-b from-emerald-50/50 to-white p-4">
                <div className="flex items-center gap-2 border-b border-emerald-100 pb-2 text-xs font-bold text-slate-900">
                  <span className="size-2 rounded-full bg-emerald-600" />
                  <span>Инструкция для iPhone (3 простых шага):</span>
                </div>

                <div className="space-y-3">
                  {/* Шаг 1 */}
                  <div className="flex items-start gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                      1
                    </span>
                    <div className="text-xs leading-relaxed text-slate-700">
                      Внизу экрана нажмите кнопку{" "}
                      <span className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-0.5 font-bold text-slate-900 shadow-2xs">
                        <Share size={13} className="text-blue-600" /> Поделиться
                      </span>
                    </div>
                  </div>

                  {/* Шаг 2 */}
                  <div className="flex items-start gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                      2
                    </span>
                    <div className="text-xs leading-relaxed text-slate-700">
                      Пролистайте меню чуть вниз и нажмите{" "}
                      <span className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2 py-0.5 font-bold text-slate-900 shadow-2xs">
                        <PlusSquare size={13} className="text-emerald-600" /> На экран «Домой»
                      </span>
                    </div>
                  </div>

                  {/* Шаг 3 */}
                  <div className="flex items-start gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                      3
                    </span>
                    <div className="text-xs leading-relaxed text-slate-700">
                      В правом верхнем углу нажмите{" "}
                      <strong className="font-bold text-emerald-700">«Добавить»</strong>. Иконка
                      магазина появится на экране вашего телефона!
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Сценарий 3: Android без прямого промпта или любой браузер */
              <div className="space-y-3.5 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold text-slate-900">
                  <span className="size-2 rounded-full bg-emerald-600" />
                  <span>Как добавить на экран:</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white">
                      1
                    </span>
                    <div className="text-xs leading-relaxed text-slate-700">
                      Нажмите меню браузера{" "}
                      <span className="inline-flex items-center rounded-md border border-slate-300 bg-white px-1.5 py-0.5 font-mono font-black text-slate-800">
                        ⋮
                      </span>{" "}
                      (три точки вверху или внизу экрана).
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white">
                      2
                    </span>
                    <div className="text-xs leading-relaxed text-slate-700">
                      Выберите пункт{" "}
                      <strong className="font-bold text-slate-900">«Установить приложение»</strong>{" "}
                      или{" "}
                      <strong className="font-bold text-slate-900">
                        «Добавить на главный экран»
                      </strong>
                      .
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              className="h-11 w-full text-xs text-slate-500 hover:text-slate-800"
            >
              Понятно, закрыть
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
