"use client";

import { useState, useTransition } from "react";

export function AuthTools({ allowSupabase }: { allowSupabase: boolean }) {
  const [resetMessage, setResetMessage] = useState(
    "Need a new password? Request a reset email here."
  );
  const [inviteMessage, setInviteMessage] = useState(
    "Invite another private user only if you want shared access."
  );
  const [isResetPending, startResetTransition] = useTransition();
  const [isInvitePending, startInviteTransition] = useTransition();

  if (!allowSupabase) {
    return null;
  }

  return (
    <div className="auth-tools">
      <form
        className="mini-form"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const formData = new FormData(form);

          startResetTransition(async () => {
            setResetMessage("Sending reset email...");
            const response = await fetch("/api/auth/reset", {
              method: "POST",
              body: formData
            });

            setResetMessage(
              response.ok
                ? "Reset email sent if that address is allowed in Supabase Auth."
                : "Could not send the reset email. Check the address and setup."
            );
          });
        }}
      >
        <h3 className="tool-title">Reset password</h3>
        <label className="upload-field">
          <span>Email</span>
          <input name="email" placeholder="your@email.com" required type="email" />
        </label>
        <button className="secondary-button" disabled={isResetPending} type="submit">
          {isResetPending ? "Sending..." : "Send reset email"}
        </button>
        <p className="helper-text">{resetMessage}</p>
      </form>

      <form
        className="mini-form"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const formData = new FormData(form);

          startInviteTransition(async () => {
            setInviteMessage("Sending invite...");
            const response = await fetch("/api/auth/invite", {
              method: "POST",
              body: formData
            });

            setInviteMessage(
              response.ok
                ? "Invite sent successfully."
                : "Could not send the invite. Make sure you are signed in and configured."
            );
          });
        }}
      >
        <h3 className="tool-title">Invite a user</h3>
        <label className="upload-field">
          <span>Email</span>
          <input name="email" placeholder="partner@email.com" required type="email" />
        </label>
        <button className="secondary-button" disabled={isInvitePending} type="submit">
          {isInvitePending ? "Inviting..." : "Send invite"}
        </button>
        <p className="helper-text">{inviteMessage}</p>
      </form>
    </div>
  );
}
