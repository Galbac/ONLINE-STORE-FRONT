import { isAccessTokenValid } from "../lib/auth-token";
import { localizeErrorMessage } from "../lib/format/localize-error";
import { API_BASE_URL, API_ENDPOINTS } from "./endpoints";

interface ApiClientConfig {
  baseUrl: string;
}

const DEFAULT_API_TIMEOUT_MS = 10000;
const UPLOAD_API_TIMEOUT_MS = 60000;
let ongoingRefreshPromise: Promise<TokenPairResponse | null> | null = null;
const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

interface StoredRefreshToken {
  remember: boolean;
  token: string;
}

const getBrowserAuthHeaders = (): HeadersInit => {
  if (typeof window === "undefined") {
    return {};
  }

  const accessToken =
    window.localStorage.getItem("access_token") ??
    window.sessionStorage.getItem("access_token") ??
    getBrowserCookieValue("access_token");

  const storeId = getBrowserCookieValue("current_store_id");
  return {
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(storeId && /^[1-9]\d*$/.test(storeId) ? { "X-Store-ID": storeId } : {}),
  };
};

const getBrowserCookieValue = (name: string): string | null => {
  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${encodeURIComponent(name)}=`));

  if (!cookie) {
    return null;
  }

  const [, value] = cookie.split("=");

  return value ? decodeURIComponent(value) : null;
};

const getStoredRefreshToken = (): StoredRefreshToken | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const token =
    window.localStorage.getItem("refresh_token") ??
    window.sessionStorage.getItem("refresh_token") ??
    getBrowserCookieValue("refresh_token") ??
    (getBrowserCookieValue("grocery_session") ? "__cookie__" : null);

  return token ? { remember: true, token } : null;
};

const storeBrowserAuthTokens = ({
  accessToken,
}: {
  accessToken: string;
  refreshToken: string;
  remember?: boolean;
}): void => {
  if (typeof window === "undefined") {
    return;
  }

  const cookieMaxAge = `; max-age=${AUTH_COOKIE_MAX_AGE_SECONDS}${window.location.protocol === "https:" ? "; secure" : ""}`;

  window.localStorage.setItem("access_token", accessToken);
  window.localStorage.removeItem("refresh_token");
  window.sessionStorage.removeItem("access_token");
  window.sessionStorage.removeItem("refresh_token");

  document.cookie = `access_token=${encodeURIComponent(accessToken)}; path=/; samesite=lax${cookieMaxAge}`;
  document.cookie = "refresh_token=; path=/; max-age=0; samesite=lax";
  window.dispatchEvent(new Event("grocery-auth-changed"));
};

const clearBrowserAuth = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem("access_token");
  window.localStorage.removeItem("refresh_token");
  window.sessionStorage.removeItem("access_token");
  window.sessionStorage.removeItem("refresh_token");
  document.cookie = "access_token=; path=/; max-age=0; samesite=lax";
  document.cookie = "refresh_token=; path=/; max-age=0; samesite=lax";
  document.cookie = "grocery_session=; path=/; max-age=0; samesite=lax";
  window.dispatchEvent(new Event("grocery-auth-changed"));
};

const redirectToLogin = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  const nextPath = `${window.location.pathname}${window.location.search}`;
  window.location.assign(`/login?mode=form&next=${encodeURIComponent(nextPath)}`);
};

interface TokenPairResponse {
  access_token: string;
  refresh_token: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly data: any;

  constructor(status: number, statusText: string, data?: any) {
    let detailMessage = "";
    if (typeof data?.detail === "string") {
      detailMessage = data.detail;
    } else if (Array.isArray(data?.detail) && data.detail.length > 0) {
      const first = data.detail[0];
      detailMessage = first?.msg || first?.message || "Ошибка валидации данных";
    }
    super(detailMessage || `Ошибка запроса (${status})`);
    this.name = "ApiError";
    this.status = status;
    this.statusText = statusText;
    this.data = data;
  }
}

export const extractErrorMessage = (
  error: unknown,
  fallback: string = "Произошла ошибка",
): string => {
  let raw: string = fallback;
  if (error instanceof ApiError) {
    if (typeof error.data?.detail === "string") {
      raw = error.data.detail;
    } else if (Array.isArray(error.data?.detail) && error.data.detail.length > 0) {
      const first = error.data.detail[0];
      raw = first?.msg || first?.message || fallback;
    } else if (error.message && !error.message.startsWith("Ошибка запроса (")) {
      raw = error.message;
    }
  } else if (typeof (error as any)?.response?.data?.detail === "string") {
    raw = (error as any).response.data.detail;
  } else if (typeof (error as any)?.message === "string") {
    raw = (error as any).message;
  }
  return localizeErrorMessage(raw);
};

export const isApiErrorStatus = (error: unknown, status: number): boolean => {
  return error instanceof ApiError && error.status === status;
};

class ApiClient {
  private readonly baseUrl: string;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
  }

  async get<TResponse>(
    url: string,
    params?: Record<string, string | number | boolean | null | undefined>,
    headers?: HeadersInit,
  ): Promise<TResponse> {
    const requestUrl = this.createRequestUrl(url);
    const requestHeaders = {
      Accept: "application/json",
      ...this.headersToRecord(getBrowserAuthHeaders()),
      ...this.headersToRecord(headers),
    };
    const requestConfig: RequestInit = {
      headers: requestHeaders,
      signal: AbortSignal.timeout(DEFAULT_API_TIMEOUT_MS),
    };

    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        requestUrl.searchParams.set(key, String(value));
      }
    });

    if (this.hasAuthorizationHeader(requestHeaders)) {
      requestConfig.cache = "no-store";
    } else {
      requestConfig.next = {
        revalidate: 60,
      };
    }

    const response = await this.fetchWithAuth(requestUrl, requestConfig);

    if (!response.ok) {
      let errData: any = null;
      try {
        errData = await response.json();
      } catch (_) {}
      throw new ApiError(response.status, response.statusText, errData);
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
        ...getBrowserAuthHeaders(),
        ...headers,
      },
      signal: AbortSignal.timeout(DEFAULT_API_TIMEOUT_MS),
    };

    if (data !== undefined) {
      config.body = JSON.stringify(data);
    }

    const response = await this.fetchWithAuth(this.getRequestEndpoint(url), config);

    if (!response.ok) {
      let errData: any = null;
      try {
        errData = await response.json();
      } catch (_) {}
      throw new ApiError(response.status, response.statusText, errData);
    }

    return (await response.json()) as TResponse;
  }

  async postForm<TResponse>(
    url: string,
    data: FormData,
    headers?: HeadersInit,
  ): Promise<TResponse> {
    const response = await this.fetchWithAuth(`${this.baseUrl}${url}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...getBrowserAuthHeaders(),
        ...headers,
      },
      body: data,
      signal: AbortSignal.timeout(UPLOAD_API_TIMEOUT_MS),
    });

    if (!response.ok) {
      let errData: any = null;
      try {
        errData = await response.json();
      } catch (_) {}
      throw new ApiError(response.status, response.statusText, errData);
    }

    return (await response.json()) as TResponse;
  }

  async patch<TRequest, TResponse>(
    url: string,
    data: TRequest,
    headers?: HeadersInit,
  ): Promise<TResponse> {
    const response = await this.fetchWithAuth(`${this.baseUrl}${url}`, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...getBrowserAuthHeaders(),
        ...headers,
      },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(DEFAULT_API_TIMEOUT_MS),
    });

    if (!response.ok) {
      let errData: any = null;
      try {
        errData = await response.json();
      } catch (_) {}
      throw new ApiError(response.status, response.statusText, errData);
    }

    return (await response.json()) as TResponse;
  }

  async delete<TResponse, TRequest = undefined>(
    url: string,
    data?: TRequest,
    headers?: HeadersInit,
  ): Promise<TResponse> {
    const config: RequestInit = {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        ...(data !== undefined ? { "Content-Type": "application/json" } : {}),
        ...getBrowserAuthHeaders(),
        ...headers,
      },
      signal: AbortSignal.timeout(DEFAULT_API_TIMEOUT_MS),
    };

    if (data !== undefined) {
      config.body = JSON.stringify(data);
    }

    const response = await this.fetchWithAuth(`${this.baseUrl}${url}`, config);

    if (!response.ok) {
      let errData: any = null;
      try {
        errData = await response.json();
      } catch (_) {}
      throw new ApiError(response.status, response.statusText, errData);
    }

    return (await response.json()) as TResponse;
  }

  private async fetchWithAuth(input: RequestInfo | URL, init: RequestInit): Promise<Response> {
    const response = await fetch(input, init);

    if (response.status !== 401 || this.isAuthOrGuestRequest(input)) {
      return response;
    }

    let tokens: TokenPairResponse | null;
    try {
      tokens = await this.refreshBrowserTokens();
    } catch (error) {
      if (error instanceof ApiError && [401, 403, 404].includes(error.status)) redirectToLogin();
      throw error;
    }

    if (!tokens) {
      return response;
    }

    return fetch(input, {
      ...init,
      signal: AbortSignal.timeout(DEFAULT_API_TIMEOUT_MS),
      headers: {
        ...this.headersToRecord(init.headers),
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });
  }

  private isAuthOrGuestRequest(input: RequestInfo | URL): boolean {
    const url = String(input);
    return (
      /\/api\/session\/(?:login|register|refresh)$/.test(url) ||
      url.endsWith(API_ENDPOINTS.AUTH.REFRESH) ||
      url.endsWith(API_ENDPOINTS.AUTH.LOGIN) ||
      url.endsWith(API_ENDPOINTS.AUTH.REGISTER) ||
      url.includes("/auth/register") ||
      url.includes("/auth/forgot-password") ||
      url.includes("/auth/reset-password")
    );
  }

  async refreshBrowserTokens(): Promise<TokenPairResponse | null> {
    if (typeof window === "undefined") return null;
    if (ongoingRefreshPromise) return ongoingRefreshPromise;
    const previousToken = getBrowserCookieValue("access_token");
    const refresh = async (): Promise<TokenPairResponse | null> => {
      const currentToken = getBrowserCookieValue("access_token");
      if (currentToken && currentToken !== previousToken && isAccessTokenValid(currentToken)) {
        return { access_token: currentToken, refresh_token: "" };
      }
      const storedRefreshToken = getStoredRefreshToken();
      if (!storedRefreshToken) {
        clearBrowserAuth();
        throw new ApiError(401, "Unauthorized", { detail: "Войдите в аккаунт" });
      }
      const response = await fetch("/api/session/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ refresh_token: storedRefreshToken.token }),
        signal: AbortSignal.timeout(DEFAULT_API_TIMEOUT_MS),
      });
      if (!response.ok) {
        if ([401, 403, 404].includes(response.status)) clearBrowserAuth();
        throw new ApiError(response.status, response.statusText, await response.json());
      }
      const tokens = (await response.json()) as TokenPairResponse;
      storeBrowserAuthTokens({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      });
      return tokens;
    };
    ongoingRefreshPromise = (async () =>
      navigator.locks
        ? await navigator.locks.request("grocery-session-refresh", async () => await refresh())
        : await refresh())().finally(() => {
      ongoingRefreshPromise = null;
    });
    return ongoingRefreshPromise;
  }

  private getRequestEndpoint(url: string): string {
    if (
      typeof window !== "undefined" &&
      [API_ENDPOINTS.AUTH.LOGIN, API_ENDPOINTS.AUTH.REGISTER, API_ENDPOINTS.AUTH.LOGOUT].some(
        (endpoint) => endpoint === url,
      )
    ) {
      return "/api/session/" + url.split("/").pop();
    }
    return `${this.baseUrl}${url}`;
  }

  private headersToRecord(headers: HeadersInit | undefined): Record<string, string> {
    if (!headers) {
      return {};
    }

    if (headers instanceof Headers) {
      return Object.fromEntries(headers.entries());
    }

    if (Array.isArray(headers)) {
      return Object.fromEntries(headers);
    }

    return headers;
  }

  private hasAuthorizationHeader(headers: Record<string, string>): boolean {
    return Object.keys(headers).some((key) => key.toLowerCase() === "authorization");
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
}

export const apiClient = new ApiClient({ baseUrl: API_BASE_URL });

export const ensureAccessToken = async (): Promise<string | null> => {
  if (typeof window === "undefined") return null;
  const token =
    window.localStorage.getItem("access_token") ?? getBrowserCookieValue("access_token");
  if (token && isAccessTokenValid(token)) return token;
  return (await apiClient.refreshBrowserTokens())?.access_token ?? null;
};
