"use client";

import { useState, useTransition } from "react";

export function CreateGhibliButton({
  hasStyledImage,
  memoryId
}: {
  hasStyledImage: boolean;
  memoryId: string;
}) {
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="ghibli-action">
      <button
        className="secondary-button ghibli-button"
        disabled={isPending}
        type="button"
        onClick={() => {
          startTransition(async () => {
            setMessage("Creating... this can take a minute.");

            const response = await fetch("/api/memories/ghibli", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                id: memoryId
              })
            });

            if (!response.ok) {
              const payload = (await response.json().catch(() => null)) as {
                error?: string;
              } | null;
              setMessage(payload?.error ?? "Could not create the Ghibli-style image right now.");
              return;
            }

            setMessage("Ready. Refreshing...");
            window.location.reload();
          });
        }}
      >
        {isPending
          ? "Creating..."
          : hasStyledImage
            ? "Refresh Ghibli pic"
            : "Create Ghibli pic"}
      </button>
      {message ? <p className="memory-inline-note">{message}</p> : null}
    </div>
  );
}
