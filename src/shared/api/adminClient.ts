import { API_BASE_URL, API_ENDPOINTS } from "./endpoints";

interface AdminApiClientConfig {
  baseUrl: string;
}

interface AdminAuthTokens {
  accessToken: string;
  refreshToken: string;
  remember: boolean;
}

const API_REQUEST_TIMEOUT_MS = 3000;
const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

const getBrowserAdminAuthHeaders = (): HeadersInit => {
  if (typeof window === "undefined") {
    return {};
  }

  const accessToken =
    window.localStorage.getItem("admin_access_token") ??
    window.sessionStorage.getItem("admin_access_token");

  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
};

export const getStoredAdminAccessToken = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    window.localStorage.getItem("admin_access_token") ??
    window.sessionStorage.getItem("admin_access_token")
  );
};

export const getStoredAdminRefreshToken = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    window.localStorage.getItem("admin_refresh_token") ??
    window.sessionStorage.getItem("admin_refresh_token")
  );
};

export const storeAdminAuthTokens = ({
  accessToken,
  refreshToken,
  remember,
}: AdminAuthTokens): void => {
  if (typeof window === "undefined") {
    return;
  }

  const targetStorage = remember ? window.localStorage : window.sessionStorage;
  const staleStorage = remember ? window.sessionStorage : window.localStorage;
  const cookieMaxAge = remember ? `; max-age=${AUTH_COOKIE_MAX_AGE_SECONDS}` : "";

  staleStorage.removeItem("admin_access_token");
  staleStorage.removeItem("admin_refresh_token");
  targetStorage.setItem("admin_access_token", accessToken);
  targetStorage.setItem("admin_refresh_token", refreshToken);
  document.cookie = `admin_access_token=${encodeURIComponent(
    accessToken,
  )}; path=/; samesite=lax${cookieMaxAge}`;
};

export const clearStoredAdminAuth = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem("admin_access_token");
  window.localStorage.removeItem("admin_refresh_token");
  window.sessionStorage.removeItem("admin_access_token");
  window.sessionStorage.removeItem("admin_refresh_token");
  document.cookie = "admin_access_token=; path=/; max-age=0; samesite=lax";
};

export class AdminApiError extends Error {
  readonly status: number;
  readonly statusText: string;

  constructor(status: number, statusText: string) {
    super(`Admin API request failed: ${status} ${statusText}`);
    this.name = "AdminApiError";
    this.status = status;
    this.statusText = statusText;
  }
}

class AdminApiClient {
  private readonly baseUrl: string;

  constructor(config: AdminApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
  }

  async get<TResponse>(
    url: string,
    params?: Record<string, string | number | boolean | null | undefined>,
    headers?: HeadersInit,
  ): Promise<TResponse> {
    const requestUrl = this.createRequestUrl(url);

    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        requestUrl.searchParams.set(key, String(value));
      }
    });

    const response = await fetch(requestUrl, {
      headers: {
        Accept: "application/json",
        ...getBrowserAdminAuthHeaders(),
        ...headers,
      },
      signal: AbortSignal.timeout(API_REQUEST_TIMEOUT_MS),
    });

    if (response.status === 401 && !this.isLoginRequest(url) && typeof window !== "undefined") {
      clearStoredAdminAuth();
      window.location.assign("/admin/login");
    }

    if (!response.ok) {
      throw new AdminApiError(response.status, response.statusText);
    }

    return (await response.json()) as TResponse;
  }

  async post<TRequest, TResponse>(
    url: string,
    data?: TRequest,
    headers?: HeadersInit,
  ): Promise<TResponse> {
    const config: RequestInit = {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...getBrowserAdminAuthHeaders(),
        ...headers,
      },
      signal: AbortSignal.timeout(API_REQUEST_TIMEOUT_MS),
    };

    if (data !== undefined) {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(`${this.baseUrl}${url}`, config);

    if (response.status === 401 && !this.isLoginRequest(url) && typeof window !== "undefined") {
      clearStoredAdminAuth();
      window.location.assign("/admin/login");
    }

    if (!response.ok) {
      throw new AdminApiError(response.status, response.statusText);
    }

    return (await response.json()) as TResponse;
  }

  async postForm<TResponse>(
    url: string,
    data: FormData,
    headers?: HeadersInit,
  ): Promise<TResponse> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...getBrowserAdminAuthHeaders(),
        ...headers,
      },
      body: data,
      signal: AbortSignal.timeout(API_REQUEST_TIMEOUT_MS),
    });

    if (response.status === 401 && !this.isLoginRequest(url) && typeof window !== "undefined") {
      clearStoredAdminAuth();
      window.location.assign("/admin/login");
    }

    if (!response.ok) {
      throw new AdminApiError(response.status, response.statusText);
    }

    return (await response.json()) as TResponse;
  }

  async patch<TRequest, TResponse>(
    url: string,
    data: TRequest,
    headers?: HeadersInit,
  ): Promise<TResponse> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...getBrowserAdminAuthHeaders(),
        ...headers,
      },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(API_REQUEST_TIMEOUT_MS),
    });

    if (response.status === 401 && !this.isLoginRequest(url) && typeof window !== "undefined") {
      clearStoredAdminAuth();
      window.location.assign("/admin/login");
    }

    if (!response.ok) {
      throw new AdminApiError(response.status, response.statusText);
    }

    return (await response.json()) as TResponse;
  }

  async delete<TResponse>(url: string, headers?: HeadersInit): Promise<TResponse> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        ...getBrowserAdminAuthHeaders(),
        ...headers,
      },
      signal: AbortSignal.timeout(API_REQUEST_TIMEOUT_MS),
    });

    if (response.status === 401 && !this.isLoginRequest(url) && typeof window !== "undefined") {
      clearStoredAdminAuth();
      window.location.assign("/admin/login");
    }

    if (!response.ok) {
      throw new AdminApiError(response.status, response.statusText);
    }

    return (await response.json()) as TResponse;
  }

  private createRequestUrl(url: string): URL {
    const requestUrl = `${this.baseUrl}${url}`;

    if (this.baseUrl) {
      return new URL(requestUrl);
    }

    if (typeof window !== "undefined") {
      return new URL(requestUrl, window.location.origin);
    }

    return new URL(requestUrl, "http://localhost");
  }

  private isLoginRequest(url: string): boolean {
    return url === API_ENDPOINTS.ADMIN_AUTH.LOGIN;
  }
}

export const adminApiClient = new AdminApiClient({ baseUrl: API_BASE_URL });
