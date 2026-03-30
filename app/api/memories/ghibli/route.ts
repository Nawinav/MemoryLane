import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { generateGhibliStyledImage } from "@/lib/ai";
import {
  getSessionCookieName,
  getSupabaseAccessCookieName,
  verifyAnySession
} from "@/lib/auth";
import {
  listMemories,
  readMemoryBytes,
  saveStyledImage,
  updateMemory
} from "@/lib/memory-store";

function extensionFromMimeType(mimeType: string) {
  if (mimeType.includes("png")) {
    return ".png";
  }

  if (mimeType.includes("webp")) {
    return ".webp";
  }

  return ".jpg";
}

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

  await updateMemory(memory.id, {
    styledImageStatus: "processing"
  });

  try {
    const bytes = await readMemoryBytes(memory);
    const generated = await generateGhibliStyledImage({
      imageBase64: bytes.toString("base64"),
      imageMimeType: "image/jpeg"
    });

    const stored = await saveStyledImage({
      bytes: Buffer.from(generated.base64, "base64"),
      extension: extensionFromMimeType(generated.mimeType),
      mimeType: generated.mimeType
    });

    const updated = await updateMemory(memory.id, {
      styledImagePath: stored.path,
      styledImageStatus: "ready",
      styledImageUrl: stored.url
    });

    return NextResponse.json({
      memory: updated
    });
  } catch (error) {
    await updateMemory(memory.id, {
      styledImageStatus: "failed"
    });

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not create the Ghibli-style image right now."
      },
      { status: 500 }
    );
  }
}
