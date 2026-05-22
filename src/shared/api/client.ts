import { API_BASE_URL } from "./endpoints";

interface ApiClientConfig {
  baseUrl: string;
}

const API_REQUEST_TIMEOUT_MS = 3000;

const getBrowserAuthHeaders = (): HeadersInit => {
  if (typeof window === "undefined") {
    return {};
  }

  const accessToken =
    window.localStorage.getItem("access_token") ?? window.sessionStorage.getItem("access_token");

  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
};

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
    const requestUrl = new URL(`${this.baseUrl}${url}`);

    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        requestUrl.searchParams.set(key, String(value));
      }
    });

    const response = await fetch(requestUrl, {
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

    const response = await fetch(`${this.baseUrl}${url}`, config);

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
    const response = await fetch(`${this.baseUrl}${url}`, {
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

    const response = await fetch(`${this.baseUrl}${url}`, config);

    if (!response.ok) {
      throw new ApiError(response.status, response.statusText);
    }

    return (await response.json()) as TResponse;
  }
}

export const apiClient = new ApiClient({ baseUrl: API_BASE_URL });
