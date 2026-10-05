"use client";

import { type ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ApiError, ensureAccessToken } from "@/shared/api/client";
import { ROUTES } from "@/shared/config";
import { isAccessTokenValid } from "@/shared/lib/auth-token";

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  remember?: boolean;
}

const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export const getLoginRedirectHref = (pathname: string): string => {
  return `${ROUTES.LOGIN}?mode=form&next=${encodeURIComponent(pathname)}`;
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
    getCookieValue("refresh_token") ??
    (getCookieValue("grocery_session") ? "__cookie__" : null)
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
  document.cookie = "grocery_session=; path=/; max-age=0; samesite=lax";
  window.dispatchEvent(new Event("grocery-auth-changed"));
};

export const storeAuthTokens = ({ accessToken }: AuthTokens): void => {
  if (typeof window === "undefined") return;
  const cookieMaxAge = `; max-age=${AUTH_COOKIE_MAX_AGE_SECONDS}${window.location.protocol === "https:" ? "; secure" : ""}`;

  window.localStorage.setItem("access_token", accessToken);
  window.localStorage.removeItem("refresh_token");
  window.sessionStorage.removeItem("access_token");
  window.sessionStorage.removeItem("refresh_token");

  document.cookie = `access_token=${encodeURIComponent(accessToken)}; path=/; samesite=lax${cookieMaxAge}`;
  document.cookie = "refresh_token=; path=/; max-age=0; samesite=lax";
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

export const AuthGuard = ({ children, fallback = null }: AuthGuardProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const [connectionError, setConnectionError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const checkAuthOrRefresh = async () => {
      try {
        const token = await ensureAccessToken();
        if (!isCancelled && token) {
          setIsAllowed(true);
          setConnectionError(false);
        }
      } catch (error) {
        if (isCancelled) return;
        if (error instanceof ApiError && [401, 403, 404].includes(error.status)) {
          clearStoredAuth();
          router.replace(getLoginRedirectHref(pathname || ROUTES.PROFILE));
        } else {
          setConnectionError(true);
        }
      }
    };

    void checkAuthOrRefresh();

    return () => {
      isCancelled = true;
    };
  }, [pathname, router, retry]);

  if (connectionError && !isAllowed)
    return (
      <div className="mx-auto my-10 max-w-lg rounded-2xl border bg-white p-6">
        <p>Сервер временно недоступен. Ваш вход сохранён.</p>
        <button
          type="button"
          className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-white"
          onClick={() => setRetry((value) => value + 1)}
        >
          Повторить
        </button>
      </div>
    );
  return isAllowed ? children : fallback;
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
