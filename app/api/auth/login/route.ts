import { NextResponse } from "next/server";
import {
  buildAccessCookie,
  buildExpiredCookie,
  buildRefreshCookie,
  getSessionCookieName,
  getSessionToken,
  getSupabaseAccessCookieName,
  getSupabaseRefreshCookieName,
  verifyLoginPassword
} from "@/lib/auth";
import { getSupabaseAuthClient, isSupabaseAuthConfigured } from "@/lib/supabase";

export async function POST(request: Request) {
  const formData = await request.formData();
  const provider = `${formData.get("provider") ?? "local"}`;
  const password = `${formData.get("password") ?? ""}`;
  const email = `${formData.get("email") ?? ""}`.trim();

  if (provider === "supabase") {
    if (!isSupabaseAuthConfigured()) {
      return NextResponse.json(
        { error: "Supabase Auth is not configured." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAuthClient();
    const result = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (result.error || !result.data.session) {
      return NextResponse.json(
        { error: "Email or password was not accepted." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(
      buildAccessCookie(
        result.data.session.access_token,
        result.data.session.expires_in ?? 60 * 60
      )
    );
    response.cookies.set(buildRefreshCookie(result.data.session.refresh_token, 60 * 60 * 24 * 30));
    response.cookies.set(buildExpiredCookie(getSessionCookieName()));

    return response;
  }

  if (!(await verifyLoginPassword(password))) {
    return NextResponse.json(
      { error: "Incorrect password or incomplete auth setup." },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 14,
    name: getSessionCookieName(),
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    value: await getSessionToken()
  });
  response.cookies.set(buildExpiredCookie(getSupabaseAccessCookieName()));
  response.cookies.set(buildExpiredCookie(getSupabaseRefreshCookieName()));

  return response;
}
