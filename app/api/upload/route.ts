import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash } from "crypto";
import * as exifr from "exifr";
import { buildAiMemoryText, buildFallbackMemoryText } from "@/lib/ai";
import {
  getSessionCookieName,
  verifySessionToken
} from "@/lib/auth";
import { reverseGeocodeLocation } from "@/lib/geocode";
import { createMemory, listMemories, readMemoryBytes } from "@/lib/memory-store";
import type { MemoryEntry } from "@/lib/types";

type PartialExif = {
  DateTimeOriginal?: Date;
  latitude?: number;
  longitude?: number;
};

function buildLocationLabel(exif: PartialExif) {
  if (typeof exif.latitude === "number" && typeof exif.longitude === "number") {
    return {
      label: `Near ${exif.latitude.toFixed(4)}, ${exif.longitude.toFixed(4)}`,
      source: "gps" as const
    };
  }

  return {
    label: "Location not available in photo metadata",
    source: "manual-fallback" as const
  };
}

type LocationMeta = {
  label: string;
  source: MemoryEntry["locationSource"];
};

const MAX_BULK_UPLOAD = 20;

function hashImageBytes(bytes: Buffer) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function getExistingImageHashes() {
  const memories = await listMemories();
  const hashes = await Promise.all(
    memories.map(async (memory) => {
      try {
        const bytes = await readMemoryBytes(memory);
        return hashImageBytes(bytes);
      } catch {
        return null;
      }
    })
  );

  return new Set(hashes.filter((value): value is string => Boolean(value)));
}

async function createMemoryFromPhoto(input: {
  bytes: Buffer;
  note: string;
  photo: File;
}) {
  const bytes = input.bytes;
  const imageBase64 = bytes.toString("base64");
  const seed = `${input.photo.name}:${bytes.length}:${bytes.subarray(0, 24).toString("hex")}`;
  const extension = input.photo.name.includes(".")
    ? `.${input.photo.name.split(".").pop() ?? "jpg"}`
    : ".jpg";

  const exif = ((await exifr.parse(bytes, {
    gps: true
  })) ?? {}) as PartialExif;

  const dateTaken = exif.DateTimeOriginal
    ? exif.DateTimeOriginal.toISOString()
    : new Date().toISOString();
  const location: LocationMeta = buildLocationLabel(exif);
  let locationLabel = location.label;
  let locationSource = location.source;

  if (typeof exif.latitude === "number" && typeof exif.longitude === "number") {
    const reverseGeocoded = await reverseGeocodeLocation({
      latitude: exif.latitude,
      longitude: exif.longitude
    });

    if (reverseGeocoded) {
      locationLabel = reverseGeocoded.label;
      locationSource = reverseGeocoded.source;
    }
  }

  const title = `Memory from ${new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium"
  }).format(new Date(dateTaken))}`;

  const fallbackText = buildFallbackMemoryText({
    dateTaken,
    locationLabel,
    note: input.note,
    seed,
    title
  });
  const aiText = await buildAiMemoryText({
    dateTaken,
    fallback: fallbackText,
    imageBase64,
    imageMimeType: input.photo.type || "image/jpeg",
    locationLabel,
    note: input.note,
    seed,
    title
  });

  if (locationSource === "manual-fallback" && aiText.placeLabel) {
    locationLabel = aiText.placeLabel;
    locationSource = "ai-vision";
  }

  return createMemory({
    bytes,
    draft: {
      dateTaken,
      latitude: exif.latitude,
      longitude: exif.longitude,
      locationLabel,
      locationSource,
      note: input.note,
      placeDescription: aiText.placeDescription,
      romanticQuote: aiText.romanticQuote,
      title
    },
    extension,
    mimeType: input.photo.type || "image/jpeg"
  });
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  if (!(await verifySessionToken(cookieStore.get(getSessionCookieName())?.value))) {
    return NextResponse.json(
      { error: "Only the couple-password session can upload memories." },
      { status: 403 }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      {
        error:
          "This upload batch is too large to process in one request. Try fewer photos at a time or use the updated chunked uploader."
      },
      { status: 413 }
    );
  }

  const photos = [
    ...formData
      .getAll("photos")
      .filter((value): value is File => value instanceof File && value.size > 0),
    ...formData
      .getAll("photo")
      .filter((value): value is File => value instanceof File && value.size > 0)
  ];
  const note = `${formData.get("note") ?? ""}`.trim();

  if (photos.length === 0) {
    return NextResponse.json({ error: "At least one photo is required." }, { status: 400 });
  }

  if (photos.length > MAX_BULK_UPLOAD) {
    return NextResponse.json(
      { error: `You can upload up to ${MAX_BULK_UPLOAD} photos at once.` },
      { status: 400 }
    );
  }

  const existingHashes = await getExistingImageHashes();
  const batchHashes = new Set<string>();
  const duplicateNames: string[] = [];
  const memories = [];

  for (const [, photo] of photos.entries()) {
    const bytes = Buffer.from(await photo.arrayBuffer());
    const imageHash = hashImageBytes(bytes);

    if (existingHashes.has(imageHash) || batchHashes.has(imageHash)) {
      duplicateNames.push(photo.name);
      continue;
    }

    batchHashes.add(imageHash);
    const memory = await createMemoryFromPhoto({
      bytes,
      note,
      photo
    });
    memories.push(memory);
  }

  return NextResponse.json({
    count: memories.length,
    duplicateNames,
    memories
  });
}
