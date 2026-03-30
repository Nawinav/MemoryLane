"use client";

import { useEffect, useRef, useState } from "react";
import { AuthTools } from "@/components/auth-tools";

export function AccessControlsPopover({
  allowSupabase
}: {
  allowSupabase: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!panelRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div className="access-popover" ref={panelRef}>
      <button
        aria-expanded={isOpen}
        className="access-popover-button"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        Access Control
      </button>

      {isOpen ? (
        <div className="access-popover-panel">
          <p className="eyebrow">Access Control</p>
          <p className="access-popover-copy">
            Invite a trusted user or send a reset link without leaving the gallery.
          </p>
          <AuthTools allowSupabase={allowSupabase} />
        </div>
      ) : null}
    </div>
  );
}
