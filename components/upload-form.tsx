"use client";

import { useMemo, useRef, useState, useTransition } from "react";

const MAX_BULK_UPLOAD = 20;
const MAX_BATCH_BYTES = 18 * 1024 * 1024;

function createUploadBatches(files: File[]) {
  const batches: File[][] = [];
  let currentBatch: File[] = [];
  let currentSize = 0;

  for (const file of files) {
    const nextSize = currentSize + file.size;
    if (currentBatch.length > 0 && nextSize > MAX_BATCH_BYTES) {
      batches.push(currentBatch);
      currentBatch = [file];
      currentSize = file.size;
      continue;
    }

    currentBatch.push(file);
    currentSize = nextSize;
  }

  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  return batches;
}

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
        aria-busy={isPending}
        onSubmit={(event) => {
          event.preventDefault();
          if (files.length > MAX_BULK_UPLOAD) {
            setMessage(`You can upload up to ${MAX_BULK_UPLOAD} photos at once.`);
            return;
          }

          const form = event.currentTarget;
          const note = `${new FormData(form).get("note") ?? ""}`;
          const batches = createUploadBatches(files);

          startTransition(async () => {
            setMessage(
              files.length > 1
                ? `Creating ${files.length} memory folders...`
                : "Creating your memory folder..."
            );

            let totalSaved = 0;
            const duplicateNames: string[] = [];

            for (const [index, batch] of batches.entries()) {
              setMessage(
                batches.length > 1
                  ? `Uploading batch ${index + 1} of ${batches.length}...`
                  : "Uploading your photos..."
              );

              const batchFormData = new FormData();
              for (const file of batch) {
                batchFormData.append("photos", file);
              }
              batchFormData.append("note", note);

              const response = await fetch("/api/upload", {
                method: "POST",
                body: batchFormData
              });

              const payload = (await response.json().catch(() => null)) as
                | {
                    count?: number;
                    duplicateNames?: string[];
                    error?: string;
                  }
                | null;

              if (!response.ok) {
                setMessage(payload?.error ?? "Something went wrong while saving the photos.");
                return;
              }

              totalSaved += payload?.count ?? 0;
              duplicateNames.push(...(payload?.duplicateNames ?? []));
            }

            form.reset();
            setFiles([]);
            const duplicateCount = duplicateNames.length;
            const savedCount = totalSaved;

            if (savedCount === 0 && duplicateCount > 0) {
              setMessage("All selected photos were already uploaded, so duplicates were skipped.");
              return;
            }

            if (duplicateCount > 0) {
              setMessage(
                `Saved ${savedCount} ${savedCount === 1 ? "memory" : "memories"} and skipped ${duplicateCount} duplicate ${duplicateCount === 1 ? "photo" : "photos"}. Refreshing timeline...`
              );
            } else {
              setMessage("Memory saved successfully. Refreshing timeline...");
            }

            window.location.reload();
          });
        }}
      >
        {isPending ? (
          <div className="upload-loader-overlay" aria-live="polite" aria-label="Uploading photos">
            <div className="upload-loader-card">
              <div className="heartbeat-loader" aria-hidden="true">
                <span className="heartbeat-loader-core" />
                <span className="heartbeat-loader-ring heartbeat-loader-ring-one" />
                <span className="heartbeat-loader-ring heartbeat-loader-ring-two" />
              </div>
              <p className="upload-loader-title">Saving your memories</p>
              <p className="upload-loader-copy">{message}</p>
            </div>
          </div>
        ) : null}

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
            Upload up to 20 photos from the same day and let the website turn
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
