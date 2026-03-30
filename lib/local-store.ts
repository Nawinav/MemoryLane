import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { MemoryDraft, MemoryEntry } from "@/lib/types";

const dataDir = path.join(process.cwd(), "data");
const uploadsDir = path.join(process.cwd(), "public", "uploads");
const memoriesFile = path.join(dataDir, "memories.json");

async function ensureStorage() {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(uploadsDir, { recursive: true });

  try {
    await fs.access(memoriesFile);
  } catch {
    await fs.writeFile(memoriesFile, "[]", "utf8");
  }
}

async function readMemoryFile() {
  await ensureStorage();
  try {
    const file = await fs.readFile(memoriesFile, "utf8");
    return file.trim() ? (JSON.parse(file) as MemoryEntry[]) : [];
  } catch {
    await fs.writeFile(memoriesFile, "[]", "utf8");
    return [];
  }
}

async function writeMemoryFile(memories: MemoryEntry[]) {
  await ensureStorage();
  await fs.writeFile(memoriesFile, JSON.stringify(memories, null, 2), "utf8");
}

export async function listLocalMemories() {
  const memories = await readMemoryFile();
  return memories.sort((a, b) => {
    const left = a.dateTaken ?? a.createdAt;
    const right = b.dateTaken ?? b.createdAt;
    return right.localeCompare(left);
  });
}

export async function readLocalMemoryBytes(imagePath: string) {
  const filePath = path.join(uploadsDir, imagePath);
  return fs.readFile(filePath);
}

export async function saveLocalDerivedImage(input: {
  bytes: Buffer;
  extension: string;
}) {
  await ensureStorage();

  const fileName = `${randomUUID()}${input.extension || ".jpg"}`;
  const outputDir = path.join(process.cwd(), "public", "ghibli");
  const filePath = path.join(outputDir, fileName);

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(filePath, input.bytes);

  return {
    path: fileName,
    url: `/ghibli/${fileName}`
  };
}

export async function updateLocalMemory(
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
  const memories = await readMemoryFile();
  const index = memories.findIndex((memory) => memory.id === id);

  if (index === -1) {
    throw new Error("Memory not found.");
  }

  const nextMemory = {
    ...memories[index],
    ...updates
  };

  memories[index] = nextMemory;
  await writeMemoryFile(memories);

  return nextMemory;
}

export async function deleteLocalMemory(id: string) {
  const memories = await readMemoryFile();
  const memory = memories.find((entry) => entry.id === id);

  if (!memory) {
    throw new Error("Memory not found.");
  }

  const nextMemories = memories.filter((entry) => entry.id !== id);
  await writeMemoryFile(nextMemories);

  if (memory.imagePath) {
    const imageFilePath = path.join(uploadsDir, memory.imagePath);
    await fs.unlink(imageFilePath).catch(() => undefined);
  }

  if (memory.styledImagePath) {
    const styledFilePath = path.join(process.cwd(), "public", "ghibli", memory.styledImagePath);
    await fs.unlink(styledFilePath).catch(() => undefined);
  }

  return memory;
}

export async function createLocalMemory(input: {
  draft: MemoryDraft;
  extension: string;
  bytes: Buffer;
}) {
  await ensureStorage();

  const fileName = `${randomUUID()}${input.extension || ".jpg"}`;
  const savedFilePath = path.join(uploadsDir, fileName);

  await fs.writeFile(savedFilePath, input.bytes);

  const entry: MemoryEntry = {
    ...input.draft,
    createdAt: new Date().toISOString(),
    id: randomUUID(),
    imagePath: fileName,
    imageStorage: "local",
    imageUrl: `/uploads/${fileName}`
  };

  const memories = await readMemoryFile();
  memories.unshift(entry);
  await fs.writeFile(memoriesFile, JSON.stringify(memories, null, 2), "utf8");

  return entry;
}
