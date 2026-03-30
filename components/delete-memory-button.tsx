"use client";

import { useState, useTransition } from "react";
import { TrashIcon } from "@/components/ui-icons";

export function DeleteMemoryButton({ memoryId }: { memoryId: string }) {
  const [message, setMessage] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="delete-memory-action">
      <button
        aria-label="Delete photo"
        className="delete-icon-button"
        disabled={isPending}
        onClick={() => {
          setShowConfirm(true);
        }}
        title="Delete photo"
        type="button"
      >
        <TrashIcon className="delete-icon" />
      </button>

      {showConfirm ? (
        <div className="delete-confirmation">
          <p className="delete-confirmation-title">Delete this memory?</p>
          <p className="memory-inline-note">
            This removes the photo and its details from the gallery.
          </p>
          <div className="delete-confirmation-actions">
            <button
              className="secondary-button"
              disabled={isPending}
              onClick={() => {
                setShowConfirm(false);
                setMessage("");
              }}
              type="button"
            >
              Cancel
            </button>
            <button
              className="secondary-button danger-button"
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  setMessage("Deleting memory...");

                  const response = await fetch("/api/memories/delete", {
                    body: JSON.stringify({ id: memoryId }),
                    headers: {
                      "Content-Type": "application/json"
                    },
                    method: "POST"
                  });

                  if (!response.ok) {
                    setMessage("Could not delete this memory right now.");
                    return;
                  }

                  window.location.reload();
                });
              }}
              type="button"
            >
              {isPending ? "Deleting..." : "Delete now"}
            </button>
          </div>
        </div>
      ) : null}

      {message ? <p className="memory-inline-note">{message}</p> : null}
    </div>
  );
}
