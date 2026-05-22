"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { authApi } from "@/entities/auth";
import { cn, ROUTES } from "@/shared/config";

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
        window.localStorage.removeItem("access_token");
        window.localStorage.removeItem("refresh_token");
        window.sessionStorage.removeItem("access_token");
        window.sessionStorage.removeItem("refresh_token");
        window.location.href = ROUTES.LOGIN;
      }
    });
  };

  return (
    <button
      className={cn(
        "border-border text-text-primary hover:border-accent-primary hover:text-accent-primary inline-flex h-14 min-w-40 items-center justify-center gap-3 rounded-lg border bg-white px-6 text-base font-bold transition disabled:cursor-wait disabled:opacity-70",
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
