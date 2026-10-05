import { NextRequest, NextResponse } from "next/server";

const backendUrl = (
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8000"
).replace(/\/$/, "");
const cookieName = "grocery_refresh_token";
const actions = new Set(["login", "register", "refresh", "logout"]);

export async function POST(request: NextRequest, context: { params: Promise<{ action: string }> }) {
  const { action } = await context.params;
  if (!actions.has(action)) return NextResponse.json({ detail: "Не найдено" }, { status: 404 });
  const origin = request.headers.get("origin");
  if (
    request.headers.get("sec-fetch-site") === "cross-site" ||
    (origin && new URL(origin).host !== request.headers.get("host"))
  ) {
    return NextResponse.json({ detail: "Запрос с другого сайта запрещён" }, { status: 403 });
  }
  try {
    const body = await request.json();
    if (action === "refresh" || action === "logout") {
      const token = request.cookies.get(cookieName)?.value || body.refresh_token;
      if (!token || token === "__cookie__")
        return NextResponse.json({ detail: "Сессия завершена" }, { status: 401 });
      body.refresh_token = token;
    }
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const authorization = request.headers.get("authorization");
    if (authorization && action === "logout") headers.Authorization = authorization;
    const upstream = await fetch(`${backendUrl}/api/auth/${action}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    const data = await upstream.json();
    const refreshToken = typeof data.refresh_token === "string" ? data.refresh_token : null;
    if (refreshToken) data.refresh_token = "";
    const response = NextResponse.json(data, {
      status: upstream.status,
      headers: { "Cache-Control": "no-store" },
    });
    const secure =
      request.nextUrl.protocol === "https:" || request.headers.get("x-forwarded-proto") === "https";
    if (refreshToken) {
      response.cookies.set(cookieName, refreshToken, {
        httpOnly: true,
        secure,
        sameSite: "strict",
        path: "/api/session",
        maxAge: 31536000,
      });
      response.cookies.set("grocery_session", "1", {
        secure,
        sameSite: "lax",
        path: "/",
        maxAge: 31536000,
      });
      response.cookies.set("refresh_token", "", { path: "/", maxAge: 0 });
    }
    if (
      (action === "logout" && upstream.ok) ||
      (action === "refresh" && [401, 403, 404].includes(upstream.status))
    ) {
      response.cookies.set(cookieName, "", {
        httpOnly: true,
        secure,
        sameSite: "strict",
        path: "/api/session",
        maxAge: 0,
      });
      response.cookies.set("grocery_session", "", { path: "/", maxAge: 0 });
    }
    return response;
  } catch {
    return NextResponse.json(
      { detail: "Сервер временно недоступен. Попробуйте ещё раз." },
      { status: 503 },
    );
  }
}
