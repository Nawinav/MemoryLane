"use client";

import { useState, useTransition } from "react";

export function RegenerateMemoryButton({ memoryId }: { memoryId: string }) {
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="regenerate-action">
      <button
        className="secondary-button regenerate-button"
        disabled={isPending}
        type="button"
        onClick={() => {
          startTransition(async () => {
            setMessage("Refreshing quote...");

            const response = await fetch("/api/memories/regenerate", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                id: memoryId
              })
            });

            if (!response.ok) {
              setMessage("Could not refresh this memory right now.");
              return;
            }

            setMessage("Updated. Refreshing...");
            window.location.reload();
          });
        }}
      >
        {isPending ? "Refreshing..." : "Regenerate quote"}
      </button>
      {message ? <p className="memory-inline-note">{message}</p> : null}
    </div>
  );
}
