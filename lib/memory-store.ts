import { randomUUID } from "crypto";
import path from "path";
import {
  createLocalMemory,
  listLocalMemories,
  readLocalMemoryBytes,
  saveLocalDerivedImage,
  updateLocalMemory
} from "@/lib/local-store";
import { getSupabaseAdmin, getSupabaseBucket, isSupabaseConfigured } from "@/lib/supabase";
import type { MemoryDraft, MemoryEntry } from "@/lib/types";

type SupabaseMemoryRow = Omit<MemoryEntry, "imageUrl"> & {
  imageUrl?: string;
};

async function listSupabaseMemories(): Promise<MemoryEntry[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("memories")
    .select("*")
    .order("dateTaken", { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as SupabaseMemoryRow[];
  const bucket = getSupabaseBucket();

  return Promise.all(
    rows.map(async (row) => {
      let imageUrl = row.imageUrl ?? "";
      let styledImageUrl = row.styledImageUrl ?? "";

      if (row.imagePath) {
        const signed = await supabase.storage
          .from(bucket)
          .createSignedUrl(row.imagePath, 60 * 60);

        if (!signed.error) {
          imageUrl = signed.data.signedUrl;
        }
      }

      if (row.styledImagePath) {
        const signedStyled = await supabase.storage
          .from(bucket)
          .createSignedUrl(row.styledImagePath, 60 * 60);

        if (!signedStyled.error) {
          styledImageUrl = signedStyled.data.signedUrl;
        }
      }

      return {
        ...row,
        imageStorage: "supabase",
        imageUrl,
        styledImageUrl
      };
    })
  );
}

async function readSupabaseMemoryBytes(imagePath: string) {
  const supabase = getSupabaseAdmin();
  const bucket = getSupabaseBucket();
  const download = await supabase.storage.from(bucket).download(imagePath);

  if (download.error || !download.data) {
    throw download.error ?? new Error("Could not read memory image.");
  }

  const arrayBuffer = await download.data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function updateSupabaseMemory(
  id: string,
  updates: Partial<
    Pick<
      MemoryEntry,
      | "locationLabel"
      | "locationSource"
      | "placeDescription"
      | "romanticQuote"
      | "styledImagePath"
      | "styledImageStatus"
      | "styledImageUrl"
    >
  >
) {
  const supabase = getSupabaseAdmin();
  const result = await supabase
    .from("memories")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (result.error) {
    throw result.error;
  }

  const row = result.data as SupabaseMemoryRow;
  let imageUrl = row.imageUrl ?? "";
  let styledImageUrl = row.styledImageUrl ?? "";

  if (row.imagePath) {
    const signed = await supabase.storage
      .from(getSupabaseBucket())
      .createSignedUrl(row.imagePath, 60 * 60);

    if (!signed.error) {
      imageUrl = signed.data.signedUrl;
    }
  }

  if (row.styledImagePath) {
    const signedStyled = await supabase.storage
      .from(getSupabaseBucket())
      .createSignedUrl(row.styledImagePath, 60 * 60);

    if (!signedStyled.error) {
      styledImageUrl = signedStyled.data.signedUrl;
    }
  }

  return {
    ...row,
    imageStorage: "supabase" as const,
    imageUrl,
    styledImageUrl
  };
}

async function createSupabaseMemory(input: {
  draft: MemoryDraft;
  extension: string;
  bytes: Buffer;
  mimeType: string;
}) {
  const supabase = getSupabaseAdmin();
  const bucket = getSupabaseBucket();
  const fileName = `${randomUUID()}${path.extname(input.extension || ".jpg") || ".jpg"}`;

  const upload = await supabase.storage.from(bucket).upload(fileName, input.bytes, {
    contentType: input.mimeType,
    upsert: false
  });

  if (upload.error) {
    throw upload.error;
  }

  const entry: MemoryEntry = {
    ...input.draft,
    createdAt: new Date().toISOString(),
    id: randomUUID(),
    imagePath: fileName,
    imageStorage: "supabase",
    imageUrl: ""
  };

  const insert = await supabase.from("memories").insert(entry).select().single();

  if (insert.error) {
    throw insert.error;
  }

  const signed = await supabase.storage.from(bucket).createSignedUrl(fileName, 60 * 60);

  return {
    ...(insert.data as SupabaseMemoryRow),
    imageStorage: "supabase" as const,
    imageUrl: signed.data?.signedUrl ?? ""
  };
}

async function saveSupabaseDerivedImage(input: {
  bytes: Buffer;
  extension: string;
  mimeType: string;
}) {
  const supabase = getSupabaseAdmin();
  const bucket = getSupabaseBucket();
  const fileName = `ghibli/${randomUUID()}${path.extname(input.extension || ".jpg") || ".jpg"}`;

  const upload = await supabase.storage.from(bucket).upload(fileName, input.bytes, {
    contentType: input.mimeType,
    upsert: false
  });

  if (upload.error) {
    throw upload.error;
  }

  const signed = await supabase.storage.from(bucket).createSignedUrl(fileName, 60 * 60);

  return {
    path: fileName,
    url: signed.data?.signedUrl ?? ""
  };
}

export async function listMemories() {
  if (isSupabaseConfigured()) {
    try {
      return await listSupabaseMemories();
    } catch {
      return listLocalMemories();
    }
  }

  return listLocalMemories();
}

export async function readMemoryBytes(memory: MemoryEntry) {
  if (!memory.imagePath) {
    throw new Error("Memory image path is missing.");
  }

  if (memory.imageStorage === "supabase" && isSupabaseConfigured()) {
    try {
      return await readSupabaseMemoryBytes(memory.imagePath);
    } catch {
      return readLocalMemoryBytes(memory.imagePath);
    }
  }

  return readLocalMemoryBytes(memory.imagePath);
}

export async function updateMemory(
  id: string,
  updates: Partial<
    Pick<
      MemoryEntry,
      | "locationLabel"
      | "locationSource"
      | "placeDescription"
      | "romanticQuote"
      | "styledImagePath"
      | "styledImageStatus"
      | "styledImageUrl"
    >
  >
) {
  if (isSupabaseConfigured()) {
    try {
      return await updateSupabaseMemory(id, updates);
    } catch {
      return updateLocalMemory(id, updates);
    }
  }

  return updateLocalMemory(id, updates);
}

export async function saveStyledImage(input: {
  bytes: Buffer;
  extension: string;
  mimeType: string;
}) {
  if (isSupabaseConfigured()) {
    try {
      return await saveSupabaseDerivedImage(input);
    } catch {
      return saveLocalDerivedImage({
        bytes: input.bytes,
        extension: input.extension
      });
    }
  }

  return saveLocalDerivedImage({
    bytes: input.bytes,
    extension: input.extension
  });
}

export async function createMemory(input: {
  draft: Omit<MemoryDraft, "imageStorage" | "imageUrl">;
  extension: string;
  bytes: Buffer;
  mimeType: string;
}) {
  const memoryDraft: MemoryDraft = {
    ...input.draft,
    imageStorage: isSupabaseConfigured() ? "supabase" : "local",
    imageUrl: ""
  };

  if (isSupabaseConfigured()) {
    try {
      return await createSupabaseMemory({
        bytes: input.bytes,
        draft: memoryDraft,
        extension: input.extension,
        mimeType: input.mimeType
      });
    } catch {
      return createLocalMemory({
        bytes: input.bytes,
        draft: {
          ...memoryDraft,
          imageStorage: "local"
        },
        extension: input.extension
      });
    }
  }

  return createLocalMemory({
    bytes: input.bytes,
    draft: {
      ...memoryDraft,
      imageStorage: "local"
    },
    extension: input.extension
  });
}
