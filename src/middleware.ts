import { type NextRequest, NextResponse } from "next/server";

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

    if (adminAccessToken) {
      return NextResponse.next();
    }

    const adminLoginUrl = request.nextUrl.clone();
    adminLoginUrl.pathname = adminLoginPath;
    adminLoginUrl.searchParams.set("next", pathname);

    return NextResponse.redirect(adminLoginUrl);
  }

  const accessToken = request.cookies.get("access_token")?.value;

  if (accessToken) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", pathname);

  return NextResponse.redirect(loginUrl);
};

export const config = {
  matcher: ["/profile/:path*", "/cart", "/checkout/:path*", "/admin/:path*"],
};
