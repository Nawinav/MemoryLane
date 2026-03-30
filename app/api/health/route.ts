import { NextResponse } from "next/server";
import { isAuthConfigured, isAnyAuthConfigured } from "@/lib/auth";
import { isSupabaseAuthConfigured, isSupabaseConfigured } from "@/lib/supabase";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "memory-lane",
    storageMode: isSupabaseConfigured() ? "supabase" : "local",
    authMode: isSupabaseAuthConfigured()
      ? "supabase"
      : isAuthConfigured()
        ? "local-password"
        : "unconfigured",
    authConfigured: isAnyAuthConfigured(),
    timestamp: new Date().toISOString()
  });
}
