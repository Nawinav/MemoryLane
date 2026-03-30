"use client";

import { useMemo, useRef, useState, useTransition } from "react";

export function UploadForm() {
  const [isPending, startTransition] = useTransition();
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [message, setMessage] = useState(
    "Choose one photo or many and add one shared note."
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fileSummary = useMemo(() => {
    if (files.length === 0) {
      return "No photos selected yet";
    }

    if (files.length === 1) {
      return files[0]?.name ?? "1 photo selected";
    }

    return `${files.length} photos selected`;
  }, [files]);

  function updateFiles(nextFiles: FileList | null) {
    setFiles(nextFiles ? Array.from(nextFiles) : []);
  }

  return (
    <div className="upload-card">
      <form
        className="upload-form"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const formData = new FormData(form);

          startTransition(async () => {
            setMessage(
              files.length > 1
                ? `Creating ${files.length} memory folders...`
                : "Creating your memory folder..."
            );

            const response = await fetch("/api/upload", {
              method: "POST",
              body: formData
            });

            if (!response.ok) {
              setMessage("Something went wrong while saving the photos.");
              return;
            }

            form.reset();
            setFiles([]);
            setMessage("Memory saved successfully. Refreshing timeline...");
            window.location.reload();
          });
        }}
      >
        <div
          className={`upload-dropzone ${isDragging ? "is-dragging" : ""}`}
          onClick={() => fileInputRef.current?.click()}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            if (event.currentTarget === event.target) {
              setIsDragging(false);
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            const droppedFiles = event.dataTransfer.files;

            if (droppedFiles.length > 0 && fileInputRef.current) {
              fileInputRef.current.files = droppedFiles;
              updateFiles(droppedFiles);
            }
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              fileInputRef.current?.click();
            }
          }}
        >
          <div className="upload-icon">📷</div>
          <h3>Share your beautiful memories</h3>
          <p className="upload-intro">Drag and drop or click to upload photos</p>
          <p className="upload-caption">
            Upload one photo or many from the same day and let the website turn
            them into a romantic memory folder.
          </p>
          <div className="upload-actions">
            <button className="primary-button" type="button">
              Choose Photos
            </button>
            <span className="upload-summary">{fileSummary}</span>
          </div>
        </div>

        <input
          accept="image/*"
          className="sr-only-input"
          multiple
          name="photos"
          onChange={(event) => updateFiles(event.target.files)}
          ref={fileInputRef}
          required={files.length === 0}
          type="file"
        />

        <div className="upload-grid upload-grid-inline">
          <label className="upload-field">
            <span>Shared note</span>
            <textarea
              name="note"
              placeholder="Add one romantic note for this memory day..."
              maxLength={400}
            />
          </label>
        </div>

        <div className="upload-footer">
          <button className="primary-button" disabled={isPending} type="submit">
            {isPending ? "Saving..." : files.length > 1 ? "Save memories" : "Save memory"}
          </button>
        </div>
        <p className="helper-text">{message}</p>
      </form>
    </div>
  );
}
