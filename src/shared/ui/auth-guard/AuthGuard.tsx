"use client";

import { type ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { authApi } from "@/entities/auth";
import { ROUTES } from "@/shared/config";
import { isAccessTokenValid } from "@/shared/lib/auth-token";

interface AuthGuardProps {
  children: ReactNode;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  remember?: boolean;
}

const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export const getLoginRedirectHref = (pathname: string): string => {
  return `${ROUTES.LOGIN}?next=${encodeURIComponent(pathname)}`;
};

export const getStoredAccessToken = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const accessToken =
    window.localStorage.getItem("access_token") ??
    window.sessionStorage.getItem("access_token") ??
    getCookieValue("access_token");

  if (!accessToken) {
    return null;
  }

  if (!isAccessTokenValid(accessToken)) {
    return null;
  }

  return accessToken;
};

export const getStoredRefreshToken = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    window.localStorage.getItem("refresh_token") ??
    window.sessionStorage.getItem("refresh_token") ??
    getCookieValue("refresh_token")
  );
};

export const clearStoredAuth = (): void => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("access_token");
  window.localStorage.removeItem("refresh_token");
  window.sessionStorage.removeItem("access_token");
  window.sessionStorage.removeItem("refresh_token");
  document.cookie = "access_token=; path=/; max-age=0; samesite=lax";
  document.cookie = "refresh_token=; path=/; max-age=0; samesite=lax";
  window.dispatchEvent(new Event("grocery-auth-changed"));
};

export const storeAuthTokens = ({ accessToken, refreshToken }: AuthTokens): void => {
  if (typeof window === "undefined") return;
  const cookieMaxAge = `; max-age=${AUTH_COOKIE_MAX_AGE_SECONDS}`;

  window.localStorage.setItem("access_token", accessToken);
  window.localStorage.setItem("refresh_token", refreshToken);
  window.sessionStorage.removeItem("access_token");
  window.sessionStorage.removeItem("refresh_token");

  document.cookie = `access_token=${encodeURIComponent(accessToken)}; path=/; samesite=lax${cookieMaxAge}`;
  document.cookie = `refresh_token=${encodeURIComponent(refreshToken)}; path=/; samesite=lax${cookieMaxAge}`;
  window.dispatchEvent(new Event("grocery-auth-changed"));
};

const getCookieValue = (name: string): string | null => {
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${encodeURIComponent(name)}=`));

  if (!cookie) {
    return null;
  }

  const [, value] = cookie.split("=");

  return value ? decodeURIComponent(value) : null;
};

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const checkAuthOrRefresh = async () => {
      const accessToken = getStoredAccessToken();
      if (accessToken) {
        setIsAllowed(true);
        return;
      }

      const refreshToken = getStoredRefreshToken();
      if (refreshToken) {
        try {
          const res = await authApi.refresh({ refresh_token: refreshToken });
          if (!isCancelled && res.access_token) {
            storeAuthTokens({
              accessToken: res.access_token,
              refreshToken: res.refresh_token,
            });
            setIsAllowed(true);
            return;
          }
        } catch {
          // refresh failed
        }
      }

      if (!isCancelled) {
        clearStoredAuth();
        router.replace(getLoginRedirectHref(pathname || ROUTES.PROFILE));
      }
    };

    void checkAuthOrRefresh();

    return () => {
      isCancelled = true;
    };
  }, [pathname, router]);

  return isAllowed ? children : null;
};

interface GuestGuardProps {
  children: ReactNode;
}

export const GuestGuard = ({ children }: GuestGuardProps) => {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const accessToken = getStoredAccessToken();

    if (accessToken) {
      setIsLoggedIn(true);
      router.replace(ROUTES.HOME);
    }
  }, [router]);

  if (isLoggedIn) {
    return null;
  }

  return <>{children}</>;
};
