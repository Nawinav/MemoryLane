import Image from "next/image";
import {
  FolderHeartIcon,
  HeartIcon,
  MapPinIcon,
  SparklesIcon
} from "@/components/ui-icons";
import type { MemoryEntry } from "@/lib/types";
import { formatMemoryDate } from "@/lib/utils";

function buildMemoryHeading(memory: MemoryEntry) {
  if (memory.note.trim()) {
    return memory.note.length > 90
      ? `${memory.note.slice(0, 87).trimEnd()}...`
      : memory.note;
  }

  return formatMemoryDate(memory.dateTaken ?? memory.createdAt);
}

function buildLocationHint(memory: MemoryEntry) {
  if (
    typeof memory.latitude === "number" &&
    typeof memory.longitude === "number" &&
    memory.locationSource === "reverse-geocoded"
  ) {
    return `${memory.latitude.toFixed(4)}, ${memory.longitude.toFixed(4)}`;
  }

  if (memory.locationSource === "gps") {
    return "Read from the photo's GPS metadata";
  }

  if (memory.locationSource === "ai-vision") {
    return "Estimated from the visible scene in the photo";
  }

  return "No GPS details were available for this image";
}

function groupMemoriesByDate(memories: MemoryEntry[]) {
  const groups = new Map<string, MemoryEntry[]>();

  for (const memory of memories) {
    const key = new Intl.DateTimeFormat("en-IN", {
      dateStyle: "long"
    }).format(new Date(memory.dateTaken ?? memory.createdAt));

    const current = groups.get(key) ?? [];
    current.push(memory);
    groups.set(key, current);
  }

  return Array.from(groups.entries()).map(([label, items]) => ({
    cover: items[0],
    items,
    label
  }));
}

export function MemoryFolders({ memories }: { memories: MemoryEntry[] }) {
  if (memories.length === 0) {
    return (
      <div className="empty-state">
        <h3>No memories yet</h3>
        <p>
          Upload your first photo and the page will start creating date-based
          memory folders automatically.
        </p>
      </div>
    );
  }

  const groups = groupMemoriesByDate(memories);

  return (
    <div className="folder-list">
      {groups.map((group, index) => (
        <details
          className="folder-card"
          key={group.label}
          open={index === 0}
        >
          <summary className="folder-summary">
            <div className="folder-cover">
              <div className="folder-cover-stack" aria-hidden="true">
                {group.items.slice(0, 3).map((item, coverIndex) => (
                  <div
                    className={`folder-cover-layer folder-cover-layer-${coverIndex + 1}`}
                    key={item.id}
                  >
                    <Image
                      alt=""
                      className="folder-cover-image"
                      height={260}
                      src={item.imageUrl}
                      unoptimized
                      width={360}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="folder-copy">
              <p className="eyebrow section-icon-heading">
                <FolderHeartIcon className="inline-section-icon" />
                Memory Folder
              </p>
              <h3>{group.label}</h3>
              <p className="folder-meta">
                {group.items.length} {group.items.length === 1 ? "photo" : "photos"}
              </p>
              <p className="folder-caption">
                Open this chapter to see every photo, its place, date, and romantic
                quote.
              </p>
            </div>

            <div className="folder-toggle" aria-hidden="true">
              <span className="folder-toggle-icon">+</span>
            </div>
          </summary>

          <div className="folder-panel">
            <div className="folder-memories">
              {group.items.map((memory) => (
                <article className="folder-memory" key={memory.id}>
                  <div className="folder-memory-photo">
                    <img
                      alt={buildMemoryHeading(memory)}
                      className="folder-memory-image"
                      src={memory.imageUrl}
                    />
                  </div>

                  <div className="folder-memory-copy">
                    <p className="eyebrow">Captured Memory</p>
                    <h4>{buildMemoryHeading(memory)}</h4>

                    <div className="folder-memory-meta">
                      <div>
                        <div className="meta-label meta-label-with-icon">
                          <MapPinIcon className="meta-icon" />
                          Place
                        </div>
                        <p className="meta-text">{memory.locationLabel}</p>
                        <p className="memory-hint">{buildLocationHint(memory)}</p>
                      </div>

                      <div>
                        <div className="meta-label meta-label-with-icon">
                          <SparklesIcon className="meta-icon" />
                          Story
                        </div>
                        <p className="meta-text">{memory.placeDescription}</p>
                      </div>

                      {memory.note ? (
                        <div>
                          <div className="meta-label meta-label-with-icon">
                            <HeartIcon className="meta-icon" />
                            Personal Note
                          </div>
                          <p className="meta-text">{memory.note}</p>
                        </div>
                      ) : null}
                    </div>

                    <div className="quote-card">
                      <div className="meta-label meta-label-with-icon">
                        <HeartIcon className="meta-icon" />
                        Romantic Quote
                      </div>
                      <p className="quote-text">{memory.romanticQuote}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}
