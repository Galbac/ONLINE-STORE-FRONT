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
}

export const apiClient = new ApiClient({ baseUrl: API_BASE_URL });
