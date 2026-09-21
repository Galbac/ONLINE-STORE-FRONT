"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { toast } from "sonner";

export const OfflineIndicator = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOffline = () => {
      setIsOffline(true);
    };

    const handleOnline = () => {
      setIsOffline(false);
      toast.success("Подключение к интернету восстановлено");
    };

    if (!navigator.onLine) {
      setIsOffline(true);
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-3 left-3 right-3 z-50 mx-auto max-w-sm rounded-2xl border border-amber-200 bg-amber-50/95 px-4 py-2.5 text-center text-xs font-bold text-amber-900 shadow-lg backdrop-blur-md animate-in slide-in-from-top-3 flex items-center justify-center gap-2"
    >
      <WifiOff size={15} className="shrink-0 text-amber-700 animate-pulse" />
      <span>Нет подключения к интернету. Работаем в офлайн-режиме.</span>
    </div>
  );
};
