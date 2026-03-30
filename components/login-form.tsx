"use client";

import { useEffect, useState, useTransition } from "react";

export function LoginForm({
  allowLocalPassword,
  allowSupabase,
  nextPath
}: {
  allowLocalPassword: boolean;
  allowSupabase: boolean;
  nextPath: string;
}) {
  const hasBothOptions = allowSupabase && allowLocalPassword;
  const [provider, setProvider] = useState<"supabase" | "local">(
    allowSupabase ? "supabase" : "local"
  );
  const [message, setMessage] = useState(
    allowSupabase
      ? "Sign in with your private account to open the gallery."
      : "Enter your private password to continue."
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setProvider(allowSupabase ? "supabase" : "local");
  }, [allowLocalPassword, allowSupabase]);

  useEffect(() => {
    setMessage(
      provider === "supabase"
        ? "Sign in with your private account to open the gallery."
        : "Enter your couple password to open the gallery."
    );
  }, [provider]);

  return (
    <form
      className="login-form"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        const selectedProvider = `${formData.get("provider") ?? "local"}`;

        startTransition(async () => {
          setMessage(
            selectedProvider === "supabase"
              ? "Signing in with Supabase..."
              : "Checking password..."
          );
          const response = await fetch("/api/auth/login", {
            method: "POST",
            body: formData
          });

          if (!response.ok) {
            setMessage(
              selectedProvider === "supabase"
                ? "Email or password was not accepted. Please try again."
                : "Password was not accepted. Please try again."
            );
            return;
          }

          window.location.href = nextPath.startsWith("/") ? nextPath : "/";
        });
      }}
    >
      {hasBothOptions ? (
        <div className="auth-provider-switch" role="tablist" aria-label="Choose sign in method">
          <button
            aria-selected={provider === "supabase"}
            className={`auth-provider-tab ${provider === "supabase" ? "is-active" : ""}`}
            onClick={() => setProvider("supabase")}
            type="button"
          >
            Email login
          </button>
          <button
            aria-selected={provider === "local"}
            className={`auth-provider-tab ${provider === "local" ? "is-active" : ""}`}
            onClick={() => setProvider("local")}
            type="button"
          >
            Couple password
          </button>
        </div>
      ) : null}

      {allowSupabase && provider === "supabase" ? (
        <>
          <input name="provider" type="hidden" value="supabase" />
          <label className="upload-field">
            <span>Email</span>
            <input
              autoComplete="email"
              name="email"
              placeholder="your@email.com"
              required
              type="email"
            />
          </label>
          <label className="upload-field">
            <span>Password</span>
            <input
              autoComplete="current-password"
              name="password"
              placeholder="Enter your account password"
              required
              type="password"
            />
          </label>
        </>
      ) : null}

      {allowLocalPassword && provider === "local" ? (
        <>
          <input name="provider" type="hidden" value="local" />
          <label className="upload-field">
            <span>Password</span>
            <input
              autoComplete="current-password"
              name="password"
              placeholder="Enter your couple password"
              required
              type="password"
            />
          </label>
        </>
      ) : null}

      <button className="primary-button" disabled={isPending} type="submit">
        {isPending ? "Signing in..." : "Open private gallery"}
      </button>
      <p className="helper-text">{message}</p>
    </form>
  );
}
