import { API_BASE_URL } from "./endpoints";

interface ApiClientConfig {
  baseUrl: string;
}

class ApiClient {
  private readonly baseUrl: string;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
  }

  async get<TResponse>(
    url: string,
    params?: Record<string, string | number | boolean | null | undefined>,
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
      },
      next: {
        revalidate: 60,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as TResponse;
  }

  async post<TRequest, TResponse>(url: string, data?: TRequest): Promise<TResponse> {
    const config: RequestInit = {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    };

    if (data !== undefined) {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(`${this.baseUrl}${url}`, config);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as TResponse;
  }

  async delete<TResponse>(url: string): Promise<TResponse> {
    const response = await fetch(`${this.baseUrl}${url}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as TResponse;
  }
}

export const apiClient = new ApiClient({ baseUrl: API_BASE_URL });
