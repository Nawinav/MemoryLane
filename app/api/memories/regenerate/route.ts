import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { buildAiMemoryText, buildFallbackMemoryText } from "@/lib/ai";
import {
  getSessionCookieName,
  getSupabaseAccessCookieName,
  verifyAnySession
} from "@/lib/auth";
import { listMemories, readMemoryBytes, updateMemory } from "@/lib/memory-store";

export async function POST(request: Request) {
  const cookieStore = await cookies();

  if (
    !(await verifyAnySession({
      passwordToken: cookieStore.get(getSessionCookieName())?.value,
      supabaseAccessToken: cookieStore.get(getSupabaseAccessCookieName())?.value
    }))
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    id?: string;
  };

  if (!body.id) {
    return NextResponse.json({ error: "Memory id is required." }, { status: 400 });
  }

  const memories = await listMemories();
  const memory = memories.find((entry) => entry.id === body.id);

  if (!memory) {
    return NextResponse.json({ error: "Memory not found." }, { status: 404 });
  }

  const bytes = await readMemoryBytes(memory);
  const seed = `${memory.id}:${memory.imagePath ?? memory.imageUrl}:${bytes.length}:${bytes.subarray(0, 24).toString("hex")}`;
  const fallback = buildFallbackMemoryText({
    dateTaken: memory.dateTaken,
    locationLabel: memory.locationLabel,
    note: memory.note,
    seed,
    title: memory.title
  });
  const aiText = await buildAiMemoryText({
    dateTaken: memory.dateTaken,
    fallback,
    imageBase64: bytes.toString("base64"),
    imageMimeType: "image/jpeg",
    locationLabel: memory.locationLabel,
    note: memory.note,
    seed,
    title: memory.title
  });

  const updated = await updateMemory(memory.id, {
    locationLabel:
      memory.locationSource === "manual-fallback" && aiText.placeLabel
        ? aiText.placeLabel
        : memory.locationLabel,
    locationSource:
      memory.locationSource === "manual-fallback" && aiText.placeLabel
        ? "ai-vision"
        : memory.locationSource,
    placeDescription: aiText.placeDescription,
    romanticQuote: aiText.romanticQuote
  });

  return NextResponse.json({
    memory: updated
  });
}
