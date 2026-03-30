"use client";

import { useState, useTransition } from "react";

export function LoginForm({
  allowLocalPassword,
  allowSupabase,
  nextPath
}: {
  allowLocalPassword: boolean;
  allowSupabase: boolean;
  nextPath: string;
}) {
  const [message, setMessage] = useState(
    allowSupabase
      ? "Sign in with your private account to open the gallery."
      : "Enter your private password to continue."
  );
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="login-form"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        const provider = `${formData.get("provider") ?? "local"}`;

        startTransition(async () => {
          setMessage(
            provider === "supabase" ? "Signing in with Supabase..." : "Checking password..."
          );
          const response = await fetch("/api/auth/login", {
            method: "POST",
            body: formData
          });

          if (!response.ok) {
            setMessage(
              provider === "supabase"
                ? "Email or password was not accepted. Please try again."
                : "Password was not accepted. Please try again."
            );
            return;
          }

          window.location.href = nextPath.startsWith("/") ? nextPath : "/";
        });
      }}
    >
      {allowSupabase ? (
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

      {!allowSupabase && allowLocalPassword ? (
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
      {allowSupabase && allowLocalPassword ? (
        <p className="helper-text">
          Supabase login is active. Remove <code>SUPABASE_ANON_KEY</code> if you
          want to use only the local couple password.
        </p>
      ) : null}
      <p className="helper-text">{message}</p>
    </form>
  );
}
