create table if not exists public.memories (
  id text primary key,
  "createdAt" timestamptz not null,
  "dateTaken" timestamptz not null,
  "imageUrl" text not null default '',
  "imagePath" text,
  "imageStorage" text not null check ("imageStorage" in ('local', 'supabase')),
  latitude double precision,
  longitude double precision,
  "locationLabel" text not null,
  "locationSource" text not null check ("locationSource" in ('gps', 'reverse-geocoded', 'ai-vision', 'manual-fallback')),
  note text not null,
  "placeDescription" text not null,
  "romanticQuote" text not null,
  title text not null
);
