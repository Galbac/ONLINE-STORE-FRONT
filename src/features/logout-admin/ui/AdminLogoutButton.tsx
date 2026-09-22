"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { adminAuthApi } from "@/entities/admin-auth";
import { clearStoredAdminAuth, getStoredAdminRefreshToken } from "@/shared/api";
import { cn, ROUTES } from "@/shared/config";

interface AdminLogoutButtonProps {
  className?: string;
}

export const AdminLogoutButton = ({ className }: AdminLogoutButtonProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLogout = (): void => {
    startTransition(async () => {
      const refreshToken = getStoredAdminRefreshToken();

      if (refreshToken) {
        await adminAuthApi.logout({ refresh_token: refreshToken }).catch(() => undefined);
      }

      clearStoredAdminAuth();
      router.replace(ROUTES.ADMIN_LOGIN);
      router.refresh();
    });
  };

  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 px-3 text-sm font-bold transition disabled:cursor-wait disabled:opacity-65",
        className,
      )}
      type="button"
      disabled={isPending}
      onClick={handleLogout}
    >
      <LogOut size={17} />
      Выйти
    </button>
  );
};
