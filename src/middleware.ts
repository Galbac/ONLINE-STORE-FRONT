import { type NextRequest, NextResponse } from "next/server";

const protectedPathPrefixes = ["/profile", "/cart", "/checkout"] as const;

export const middleware = (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  const isProtectedPath = protectedPathPrefixes.some((prefix) => {
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  });

  if (!isProtectedPath) {
    return NextResponse.next();
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
  matcher: ["/profile/:path*", "/cart", "/checkout/:path*"],
};
