import { type NextRequest, NextResponse } from "next/server";

import { isAccessTokenValid } from "@/shared/lib/auth-token";

const protectedPathPrefixes = ["/profile", "/cart", "/checkout"] as const;
const protectedAdminPathPrefix = "/admin";
const adminLoginPath = "/admin/login";

export const middleware = (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  const isProtectedPath = protectedPathPrefixes.some((prefix) => {
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  });
  const isProtectedAdminPath =
    (pathname === protectedAdminPathPrefix || pathname.startsWith(`${protectedAdminPathPrefix}/`)) &&
    pathname !== adminLoginPath;

  if (!isProtectedPath && !isProtectedAdminPath) {
    return NextResponse.next();
  }

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

  if (accessToken && isAccessTokenValid(accessToken)) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", pathname);

  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete("access_token");

  return response;
};

export const config = {
  matcher: ["/profile/:path*", "/cart/:path*", "/checkout/:path*", "/admin/:path*"],
};
