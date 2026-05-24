interface JwtPayload {
  exp?: unknown;
}

const TOKEN_EXPIRY_LEEWAY_SECONDS = 5;

export const isAccessTokenValid = (token: string): boolean => {
  const payload = parseJwtPayload(token);

  if (!payload || typeof payload.exp !== "number") {
    return false;
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);

  return payload.exp > nowInSeconds + TOKEN_EXPIRY_LEEWAY_SECONDS;
};

const parseJwtPayload = (token: string): JwtPayload | null => {
  const [, encodedPayload] = token.split(".");

  if (!encodedPayload) {
    return null;
  }

  try {
    const normalizedPayload = encodedPayload.replace(/-/g, "+").replace(/_/g, "/");
    const paddingLength = (4 - (normalizedPayload.length % 4)) % 4;
    const decodedPayload = atob(`${normalizedPayload}${"=".repeat(paddingLength)}`);
    const payload: unknown = JSON.parse(decodedPayload);

    if (!isRecord(payload)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};
