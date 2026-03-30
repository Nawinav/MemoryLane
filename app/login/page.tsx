import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AuthTools } from "@/components/auth-tools";
import { LoginForm } from "@/components/login-form";
import {
  getSessionCookieName,
  getSupabaseAccessCookieName,
  isAnyAuthConfigured,
  isAuthConfigured,
  verifyAnySession
} from "@/lib/auth";
import { isSupabaseAuthConfigured } from "@/lib/supabase";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const cookieStore = await cookies();

  if (
    await verifyAnySession({
      passwordToken: cookieStore.get(getSessionCookieName())?.value,
      supabaseAccessToken: cookieStore.get(getSupabaseAccessCookieName())?.value
    })
  ) {
    redirect("/");
  }

  const params = await searchParams;

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="eyebrow">Aishwarya - Naveen Photo Gallery</p>
        <h1>Sign in to view our shared memories.</h1>

        {!isAnyAuthConfigured() ? (
          <div className="auth-warning">
            <strong>Setup required.</strong>
            <p>
              Add either <code>SUPABASE_ANON_KEY</code> for Supabase Auth or the
              local <code>MEMORY_LANE_PASSWORD</code> and{" "}
              <code>MEMORY_LANE_SESSION_SECRET</code> values to your{" "}
              <code>.env.local</code> file before logging in.
            </p>
          </div>
        ) : (
          <>
            <LoginForm
              allowLocalPassword={isAuthConfigured()}
              allowSupabase={isSupabaseAuthConfigured()}
              nextPath={params.next ?? "/"}
            />
            <AuthTools allowSupabase={isSupabaseAuthConfigured()} />
          </>
        )}
      </section>
    </main>
  );
}
