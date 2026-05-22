import { API_BASE_URL, API_ENDPOINTS } from "./endpoints";

interface ApiClientConfig {
  baseUrl: string;
}

const API_REQUEST_TIMEOUT_MS = 3000;
const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

interface StoredRefreshToken {
  remember: boolean;
  token: string;
}

const getBrowserAuthHeaders = (): HeadersInit => {
  if (typeof window === "undefined") {
    return {};
  }

  const accessToken =
    window.localStorage.getItem("access_token") ?? window.sessionStorage.getItem("access_token");

  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
};

const getStoredRefreshToken = (): StoredRefreshToken | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const localRefreshToken = window.localStorage.getItem("refresh_token");

  if (localRefreshToken) {
    return {
      remember: true,
      token: localRefreshToken,
    };
  }

  const sessionRefreshToken = window.sessionStorage.getItem("refresh_token");

  return sessionRefreshToken
    ? {
        remember: false,
        token: sessionRefreshToken,
      }
    : null;
};

const storeBrowserAuthTokens = ({
  accessToken,
  refreshToken,
  remember,
}: {
  accessToken: string;
  refreshToken: string;
  remember: boolean;
}): void => {
  if (typeof window === "undefined") {
    return;
  }

  const targetStorage = remember ? window.localStorage : window.sessionStorage;
  const staleStorage = remember ? window.sessionStorage : window.localStorage;
  const cookieMaxAge = remember ? `; max-age=${AUTH_COOKIE_MAX_AGE_SECONDS}` : "";

  staleStorage.removeItem("access_token");
  staleStorage.removeItem("refresh_token");
  targetStorage.setItem("access_token", accessToken);
  targetStorage.setItem("refresh_token", refreshToken);
  document.cookie = `access_token=${encodeURIComponent(accessToken)}; path=/; samesite=lax${cookieMaxAge}`;
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
};

const redirectToLogin = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  const nextPath = `${window.location.pathname}${window.location.search}`;
  window.location.assign(`/login?next=${encodeURIComponent(nextPath)}`);
};

interface TokenPairResponse {
  access_token: string;
  refresh_token: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly statusText: string;

  constructor(status: number, statusText: string) {
    super(`API request failed: ${status} ${statusText}`);
    this.name = "ApiError";
    this.status = status;
    this.statusText = statusText;
  }
}

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

    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        requestUrl.searchParams.set(key, String(value));
      }
    });

    const response = await this.fetchWithAuth(requestUrl, {
      headers: {
        Accept: "application/json",
        ...getBrowserAuthHeaders(),
        ...headers,
      },
      next: {
        revalidate: 60,
      },
      signal: AbortSignal.timeout(API_REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new ApiError(response.status, response.statusText);
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
      signal: AbortSignal.timeout(API_REQUEST_TIMEOUT_MS),
    };

    if (data !== undefined) {
      config.body = JSON.stringify(data);
    }

    const response = await this.fetchWithAuth(`${this.baseUrl}${url}`, config);

    if (!response.ok) {
      throw new ApiError(response.status, response.statusText);
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
      signal: AbortSignal.timeout(API_REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new ApiError(response.status, response.statusText);
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
      signal: AbortSignal.timeout(API_REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new ApiError(response.status, response.statusText);
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
      signal: AbortSignal.timeout(API_REQUEST_TIMEOUT_MS),
    };

    if (data !== undefined) {
      config.body = JSON.stringify(data);
    }

    const response = await this.fetchWithAuth(`${this.baseUrl}${url}`, config);

    if (!response.ok) {
      throw new ApiError(response.status, response.statusText);
    }

    return (await response.json()) as TResponse;
  }

  private async fetchWithAuth(input: RequestInfo | URL, init: RequestInit): Promise<Response> {
    const response = await fetch(input, init);

    if (response.status !== 401 || this.isRefreshRequest(input)) {
      return response;
    }

    const tokens = await this.refreshBrowserTokens();

    if (!tokens) {
      return response;
    }

    return fetch(input, {
      ...init,
      headers: {
        ...this.headersToRecord(init.headers),
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });
  }

  private isRefreshRequest(input: RequestInfo | URL): boolean {
    const url = String(input);

    return url.endsWith(API_ENDPOINTS.AUTH.REFRESH);
  }

  private async refreshBrowserTokens(): Promise<TokenPairResponse | null> {
    const storedRefreshToken = getStoredRefreshToken();

    if (!storedRefreshToken) {
      clearBrowserAuth();
      redirectToLogin();
      return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.AUTH.REFRESH}`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refresh_token: storedRefreshToken.token,
        }),
        signal: AbortSignal.timeout(API_REQUEST_TIMEOUT_MS),
      });

      if (!response.ok) {
        clearBrowserAuth();
        redirectToLogin();
        return null;
      }

      const tokens = (await response.json()) as TokenPairResponse;

      storeBrowserAuthTokens({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        remember: storedRefreshToken.remember,
      });

      return tokens;
    } catch {
      clearBrowserAuth();
      redirectToLogin();
      return null;
    }
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
