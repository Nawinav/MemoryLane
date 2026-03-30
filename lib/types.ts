export type MemoryEntry = {
  id: string;
  createdAt: string;
  dateTaken: string;
  imageUrl: string;
  imagePath?: string;
  imageStorage: "local" | "supabase";
  styledImagePath?: string;
  styledImageUrl?: string;
  styledImageStatus?: "idle" | "processing" | "ready" | "failed";
  latitude?: number;
  longitude?: number;
  locationLabel: string;
  locationSource: "gps" | "reverse-geocoded" | "ai-vision" | "manual-fallback";
  note: string;
  placeDescription: string;
  romanticQuote: string;
  title: string;
};

export type MemoryDraft = Omit<MemoryEntry, "createdAt" | "id">;
