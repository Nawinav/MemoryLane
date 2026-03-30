import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteMemory } from "@/lib/memory-store";
import { getSessionCookieName, verifySessionToken } from "@/lib/auth";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const localSessionToken = cookieStore.get(getSessionCookieName())?.value;

  if (!(await verifySessionToken(localSessionToken))) {
    return NextResponse.json(
      { error: "Only the couple-password session can delete memories." },
      { status: 403 }
    );
  }

  const body = (await request.json().catch(() => null)) as { id?: string } | null;
  const id = body?.id?.trim();

  if (!id) {
    return NextResponse.json({ error: "Memory id is required." }, { status: 400 });
  }

  await deleteMemory(id);
  return NextResponse.json({ ok: true });
}
