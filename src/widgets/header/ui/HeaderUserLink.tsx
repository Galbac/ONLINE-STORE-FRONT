"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRound } from "lucide-react";
import { ROUTES } from "@/shared/config";
import { getStoredAccessToken } from "@/shared/ui";

export const HeaderUserLink = () => {
  const pathname = usePathname() || "";
  const [isAuth, setIsAuth] = useState(false);
  const isNotificationsPage = pathname.startsWith(ROUTES.PROFILE_NOTIFICATIONS);
  const isFavoritesPage = pathname.startsWith(ROUTES.PROFILE_FAVORITES);
  const isActive =
    isAuth &&
    !isNotificationsPage &&
    !isFavoritesPage &&
    (pathname === ROUTES.PROFILE || pathname.startsWith(`${ROUTES.PROFILE}/`));

  useEffect(() => {
    const checkAuth = () => {
      const token = getStoredAccessToken();
      setIsAuth(Boolean(token));
    };

    checkAuth();
    window.addEventListener("focus", checkAuth);
    return () => window.removeEventListener("focus", checkAuth);
  }, []);

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={`hidden w-[72px] shrink-0 flex-col items-center justify-center rounded-xl p-2 text-xs font-semibold transition active:scale-95 lg:flex ${
        isActive ? "bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
      }`}
      href={isAuth ? ROUTES.PROFILE : ROUTES.LOGIN}
    >
      <UserRound size={20} className="mb-0.5" />
      <span>{isAuth ? "Профиль" : "Войти"}</span>
    </Link>
  );
};
