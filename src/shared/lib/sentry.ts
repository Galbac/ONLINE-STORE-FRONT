import * as Sentry from "@sentry/nextjs";

export const captureClientException = (error: unknown, context?: Record<string, unknown>): void => {
  if (process.env.NODE_ENV !== "production") {
    console.error("[Client Exception]:", error, context);
  }

  try {
    if (context) {
      Sentry.captureException(error, { extra: context });
    } else {
      Sentry.captureException(error);
    }
  } catch {
    // Fallback
  }
};
