import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  buildAccessCookie,
  buildExpiredCookie,
  buildRefreshCookie,
  getSessionCookieName,
  getSupabaseAccessCookieName,
  getSupabaseRefreshCookieName,
  refreshSupabaseSession,
  verifyAnySession
} from "@/lib/auth";

const PUBLIC_PATH_PREFIXES = ["/_next", "/api/auth", "/login"];
const PUBLIC_FILES = ["/favicon.ico"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    PUBLIC_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    PUBLIC_FILES.includes(pathname)
  ) {
    return NextResponse.next();
  }

  const isAuthenticated = await verifyAnySession({
    passwordToken: request.cookies.get(getSessionCookieName())?.value,
    supabaseAccessToken: request.cookies.get(getSupabaseAccessCookieName())?.value
  });

  if (isAuthenticated) {
    return NextResponse.next();
  }

  const refreshedSession = await refreshSupabaseSession(
    request.cookies.get(getSupabaseRefreshCookieName())?.value
  );

  if (refreshedSession) {
    const response = NextResponse.next();
    response.cookies.set(
      buildAccessCookie(
        refreshedSession.access_token,
        refreshedSession.expires_in ?? 60 * 60
      )
    );
    response.cookies.set(
      buildRefreshCookie(refreshedSession.refresh_token, 60 * 60 * 24 * 30)
    );
    return response;
  }

  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.set(buildExpiredCookie(getSupabaseAccessCookieName()));
  response.cookies.set(buildExpiredCookie(getSupabaseRefreshCookieName()));
  response.cookies.set(buildExpiredCookie(getSessionCookieName()));

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);
  response.headers.set("Location", loginUrl.toString());
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"]
};
