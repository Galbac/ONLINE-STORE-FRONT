"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserRound } from "lucide-react";
import { ROUTES } from "@/shared/config";
import { isAccessTokenValid } from "@/shared/lib/auth-token";

export const HeaderUserLink = () => {
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token =
        window.localStorage.getItem("access_token") ??
        window.sessionStorage.getItem("access_token");
      setIsAuth(Boolean(token && isAccessTokenValid(token)));
    };

    checkAuth();
    window.addEventListener("focus", checkAuth);
    return () => window.removeEventListener("focus", checkAuth);
  }, []);

  return (
    <Link
      className="hidden flex-col items-center justify-center rounded-xl p-2 text-xs font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700 active:scale-95 lg:flex"
      href={isAuth ? ROUTES.PROFILE : ROUTES.LOGIN}
    >
      <UserRound size={20} className="mb-0.5" />
      <span>{isAuth ? "Профиль" : "Войти"}</span>
    </Link>
  );
};
