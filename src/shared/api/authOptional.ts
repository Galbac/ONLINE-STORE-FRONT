import { isApiErrorStatus } from "./client";

export const fallbackOnUnauthorized = async <TResponse>(
  request: Promise<TResponse>,
  fallback: TResponse,
): Promise<TResponse> => {
  try {
    return await request;
  } catch (error) {
    if (isApiErrorStatus(error, 401)) {
      return fallback;
    }

    throw error;
  }
};
