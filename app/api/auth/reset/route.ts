import { NextResponse } from "next/server";
import { getSupabaseAuthClient, isSupabaseAuthConfigured } from "@/lib/supabase";

function getSiteUrl(request: Request) {
  return process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
}

export async function POST(request: Request) {
  if (!isSupabaseAuthConfigured()) {
    return NextResponse.json(
      { error: "Supabase Auth is not configured." },
      { status: 400 }
    );
  }

  const formData = await request.formData();
  const email = `${formData.get("email") ?? ""}`.trim();

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const supabase = getSupabaseAuthClient();
  const result = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getSiteUrl(request)}/login`
  });

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
