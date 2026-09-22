"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { authApi } from "@/entities/auth";
import { cn, ROUTES } from "@/shared/config";
import { clearStoredAuth } from "@/shared/ui";

export const ProfileLogoutButton = () => {
  const [isPending, startTransition] = useTransition();

  const handleLogout = (): void => {
    startTransition(async () => {
      const refreshToken =
        window.localStorage.getItem("refresh_token") ??
        window.sessionStorage.getItem("refresh_token");

      try {
        if (refreshToken) {
          await authApi.logout({ refresh_token: refreshToken });
        }
      } catch {
        // Локальный выход важнее сетевой ошибки: токены всё равно удаляем ниже.
      } finally {
        clearStoredAuth();
        window.location.href = ROUTES.LOGIN;
      }
    });
  };

  return (
    <button
      className={cn(
        "inline-flex h-12 min-w-36 items-center justify-center gap-2.5 rounded-xl border border-rose-200/90 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-300 hover:text-rose-800 active:scale-[0.98] px-5 text-sm font-bold shadow-xs transition-all disabled:cursor-wait disabled:opacity-70",
        isPending && "cursor-wait opacity-70",
      )}
      type="button"
      disabled={isPending}
      onClick={handleLogout}
    >
      <LogOut size={20} />
      Выйти
    </button>
  );
};
