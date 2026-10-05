import { type NextRequest, NextResponse } from "next/server";
import { isAccessTokenValid } from "@/shared/lib/auth-token";
import { isMobileUserAgent } from "@/shared/lib/device/isMobileUserAgent";

const protectedPathPrefixes = ["/profile", "/cart", "/checkout"] as const;
const protectedAdminPathPrefix = "/admin";
const adminLoginPath = "/admin/login";
const guestAccessiblePaths = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/privacy",
  "/offer",
  "/cookies",
  "/personal-data-consent",
] as const;

const isGuestAccessiblePath = (pathname: string): boolean => {
  return guestAccessiblePaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
};

export const middleware = (request: NextRequest) => {
  const { pathname } = request.nextUrl;

  const isProtectedPath = protectedPathPrefixes.some((prefix) => {
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  });
  const isProtectedAdminPath =
    (pathname === protectedAdminPathPrefix ||
      pathname.startsWith(`${protectedAdminPathPrefix}/`)) &&
    pathname !== adminLoginPath;

  if (isProtectedAdminPath) {
    const adminAccessToken = request.cookies.get("admin_access_token")?.value;

    if (adminAccessToken && isAccessTokenValid(adminAccessToken)) {
      return NextResponse.next();
    }

    const adminLoginUrl = request.nextUrl.clone();
    adminLoginUrl.pathname = adminLoginPath;
    adminLoginUrl.searchParams.set("next", pathname);

    const response = NextResponse.redirect(adminLoginUrl);
    response.cookies.delete("admin_access_token");

    return response;
  }

  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;
  const isMobileDevice = isMobileUserAgent(request.headers.get("user-agent") ?? "");
  const hasCustomerSession =
    Boolean(accessToken && isAccessTokenValid(accessToken)) || Boolean(refreshToken);

  if (
    isMobileDevice &&
    !pathname.startsWith(`${protectedAdminPathPrefix}/`) &&
    !isGuestAccessiblePath(pathname) &&
    !hasCustomerSession
  ) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);

    return NextResponse.redirect(loginUrl);
  }

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  if (accessToken && isAccessTokenValid(accessToken)) {
    return NextResponse.next();
  }

  if (refreshToken) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", pathname);

  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete("access_token");
  response.cookies.delete("refresh_token");

  return response;
};

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icons/|.*\\.(?:svg|png|jpg|jpeg|webp|ico|js|txt|xml|webmanifest)$).*)",
  ],
};
