import Image from "next/image";
import type { MemoryEntry } from "@/lib/types";
import { formatMemoryDate } from "@/lib/utils";

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

  return "No GPS details were available for this image";
}

export function MemoryTimeline({ memories }: { memories: MemoryEntry[] }) {
  if (memories.length === 0) {
    return (
      <div className="empty-state">
        <h3>No memories yet</h3>
        <p>
          Start by uploading your first couple photo. The website will create a
          beautiful memory card from it.
        </p>
      </div>
    );
  }

  return (
    <div className="memory-grid scrapbook-grid">
      {memories.map((memory, index) => {
        const variant =
          index % 5 === 0
            ? "memory-card memory-card-featured"
            : index % 3 === 0
              ? "memory-card memory-card-note"
              : "memory-card";

        return (
        <article className={variant} key={memory.id}>
          <div className="memory-photo-frame">
          <Image
            alt={memory.title}
            className="memory-image"
            height={900}
            priority={false}
            src={memory.imageUrl}
            unoptimized
            width={720}
          />
          </div>

          <div className="memory-content">
            <div className="memory-heading">
              <p className="eyebrow">Captured Memory</p>
              <h3>{memory.title}</h3>
            </div>

            <div className="memory-meta">
              <div>
                <div className="meta-label">Date</div>
                <p className="meta-text">
                  {formatMemoryDate(memory.dateTaken ?? memory.createdAt)}
                </p>
              </div>

              <div>
                <div className="meta-label">Place</div>
                <p className="meta-text">{memory.locationLabel}</p>
                <p className="memory-hint">{buildLocationHint(memory)}</p>
              </div>

              <div>
                <div className="meta-label">Story</div>
                <p className="meta-text">{memory.placeDescription}</p>
              </div>

              {memory.note ? (
                <div>
                  <div className="meta-label">Personal Note</div>
                  <p className="meta-text">{memory.note}</p>
                </div>
              ) : null}
            </div>

            <div className="quote-card">
              <div className="meta-label">Romantic Quote</div>
              <p className="quote-text">{memory.romanticQuote}</p>
            </div>
          </div>
        </article>
      );
      })}
    </div>
  );
}
