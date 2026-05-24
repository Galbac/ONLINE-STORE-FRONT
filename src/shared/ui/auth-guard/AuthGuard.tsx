"use client";

import { type ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { ROUTES } from "@/shared/config";
import { isAccessTokenValid } from "@/shared/lib/auth-token";

interface AuthGuardProps {
  children: ReactNode;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  remember: boolean;
}

const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export const getLoginRedirectHref = (pathname: string): string => {
  return `${ROUTES.LOGIN}?next=${encodeURIComponent(pathname)}`;
};

export const getStoredAccessToken = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const accessToken =
    window.localStorage.getItem("access_token") ?? window.sessionStorage.getItem("access_token");

  if (!accessToken) {
    return null;
  }

  if (!isAccessTokenValid(accessToken)) {
    clearStoredAuth();
    return null;
  }

  return accessToken;
};

export const clearStoredAuth = (): void => {
  window.localStorage.removeItem("access_token");
  window.localStorage.removeItem("refresh_token");
  window.sessionStorage.removeItem("access_token");
  window.sessionStorage.removeItem("refresh_token");
  document.cookie = "access_token=; path=/; max-age=0; samesite=lax";
};

export const storeAuthTokens = ({ accessToken, refreshToken, remember }: AuthTokens): void => {
  const storage = remember ? window.localStorage : window.sessionStorage;
  const staleStorage = remember ? window.sessionStorage : window.localStorage;
  const cookieMaxAge = remember ? `; max-age=${AUTH_COOKIE_MAX_AGE_SECONDS}` : "";

  staleStorage.removeItem("access_token");
  staleStorage.removeItem("refresh_token");
  storage.setItem("access_token", accessToken);
  storage.setItem("refresh_token", refreshToken);
  document.cookie = `access_token=${encodeURIComponent(accessToken)}; path=/; samesite=lax${cookieMaxAge}`;
};

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    const accessToken = getStoredAccessToken();

    if (!accessToken) {
      router.replace(getLoginRedirectHref(pathname || ROUTES.PROFILE));
      return;
    }

    setIsAllowed(true);
  }, [pathname, router]);

  return isAllowed ? children : null;
};
