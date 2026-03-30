import { NextResponse } from "next/server";
import {
  buildExpiredCookie,
  getSessionCookieName,
  getSupabaseAccessCookieName,
  getSupabaseRefreshCookieName
} from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(buildExpiredCookie(getSessionCookieName()));
  response.cookies.set(buildExpiredCookie(getSupabaseAccessCookieName()));
  response.cookies.set(buildExpiredCookie(getSupabaseRefreshCookieName()));
  return response;
}
