import { getSupabaseAuthClient, isSupabaseAuthConfigured } from "@/lib/supabase";

const SESSION_COOKIE = "memory_lane_session";
const SUPABASE_ACCESS_COOKIE = "memory_lane_supabase_access";
const SUPABASE_REFRESH_COOKIE = "memory_lane_supabase_refresh";

function getPassword() {
  return process.env.MEMORY_LANE_PASSWORD ?? "";
}

function getSessionSecret() {
  return process.env.MEMORY_LANE_SESSION_SECRET ?? "";
}

async function createSignature(input: string) {
  const secret = getSessionSecret();

  if (!secret) {
    return "";
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    {
      hash: "SHA-256",
      name: "HMAC"
    },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(input)
  );

  return Array.from(new Uint8Array(signature))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

export async function getSessionToken() {
  return createSignature("memory-lane-authenticated");
}

export function isAuthConfigured() {
  return Boolean(getPassword() && getSessionSecret());
}

export function isAnyAuthConfigured() {
  return isAuthConfigured() || isSupabaseAuthConfigured();
}

export async function verifyLoginPassword(password: string) {
  if (!isAuthConfigured()) {
    return false;
  }

  const expected = getPassword();
  return password === expected;
}

export async function verifySessionToken(token: string | undefined) {
  if (!token || !isAuthConfigured()) {
    return false;
  }

  const expected = await getSessionToken();
  return token === expected;
}

export function getSessionCookieName() {
  return SESSION_COOKIE;
}

export function getSupabaseAccessCookieName() {
  return SUPABASE_ACCESS_COOKIE;
}

export function getSupabaseRefreshCookieName() {
  return SUPABASE_REFRESH_COOKIE;
}

export function buildExpiredCookie(name: string) {
  return {
    expires: new Date(0),
    httpOnly: true,
    name,
    path: "/",
    sameSite: "lax" as const,
    value: ""
  };
}

export function buildAccessCookie(value: string, maxAge: number) {
  return {
    httpOnly: true,
    maxAge,
    name: getSupabaseAccessCookieName(),
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    value
  };
}

export function buildRefreshCookie(value: string, maxAge: number) {
  return {
    httpOnly: true,
    maxAge,
    name: getSupabaseRefreshCookieName(),
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    value
  };
}

export async function verifySupabaseAccessToken(token: string | undefined) {
  if (!token || !isSupabaseAuthConfigured()) {
    return false;
  }

  try {
    const supabase = getSupabaseAuthClient();
    const result = await supabase.auth.getUser(token);
    return !result.error && Boolean(result.data.user);
  } catch {
    return false;
  }
}

export async function verifyAnySession(input: {
  passwordToken?: string;
  supabaseAccessToken?: string;
}) {
  if (await verifySupabaseAccessToken(input.supabaseAccessToken)) {
    return true;
  }

  return verifySessionToken(input.passwordToken);
}

export async function refreshSupabaseSession(refreshToken: string | undefined) {
  if (!refreshToken || !isSupabaseAuthConfigured()) {
    return null;
  }

  try {
    const supabase = getSupabaseAuthClient();
    const result = await supabase.auth.refreshSession({
      refresh_token: refreshToken
    });

    if (result.error || !result.data.session) {
      return null;
    }

    return result.data.session;
  } catch {
    return null;
  }
}
