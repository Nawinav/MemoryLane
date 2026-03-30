# Memory Lane

A starter website for a couple's memory gallery.

## Features

- Upload couple photos into local storage under `public/uploads`
- Store memory records in `data/memories.json`
- Extract EXIF date and GPS coordinates from uploaded images
- Reverse-geocode GPS coordinates into readable place names when lookup succeeds
- Show a romantic timeline with place descriptions and quotes
- Protect the full gallery with either Supabase Auth or a local password fallback
- Support invite emails, password reset emails, and refresh-aware Supabase sessions
- Use fallback text by default, or set `OPENAI_API_KEY` to generate AI copy

## Setup

1. Install dependencies with `npm install`
2. Run the app with `npm run dev`
3. Open `http://localhost:3000`

## Vercel deployment

1. Push this project to GitHub
2. Import the repository into Vercel
3. Add the same environment variables from [.env.example](C:\Users\ADMIN\OneDrive\Documents\New%20project\.env.example) in the Vercel project settings
4. Set `NEXT_PUBLIC_SITE_URL` to your real Vercel domain or custom domain
5. Deploy and test [app/api/health/route.ts](C:\Users\ADMIN\OneDrive\Documents\New%20project\app\api\health\route.ts) at `/api/health`

For production, Supabase storage and Supabase Auth are the recommended setup on Vercel.

## Optional AI setup

Create `.env.local` with:

```env
MEMORY_LANE_PASSWORD=choose_a_private_password
MEMORY_LANE_SESSION_SECRET=use_a_long_random_secret
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4.1-mini
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_BUCKET=memories
```

## Optional Supabase cloud setup

1. Create a bucket named `memories` in Supabase Storage
2. Run the SQL in [supabase/schema.sql](C:\Users\ADMIN\OneDrive\Documents\New%20project\supabase\schema.sql)
3. Add `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_BUCKET` to `.env.local`
4. Restart the app

## Optional Supabase Auth setup

1. In Supabase Auth, create the allowed user account for the couple
2. Keep `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `.env.local`
3. Open the website and sign in with that email and password

## Invite and reset flows

1. Use the login screen or dashboard tools to send a password reset email
2. Use the invite form while signed in to send a private invite to another trusted user
3. Set `NEXT_PUBLIC_SITE_URL` in production so Supabase redirect emails return to the right domain

If Supabase storage is not configured, the website automatically falls back to local files in `public/uploads` and `data/memories.json`.

## Notes

- The website can use Supabase Auth for private sign-in, or `MEMORY_LANE_PASSWORD` and `MEMORY_LANE_SESSION_SECRET` as a local fallback.
- Reverse geocoding uses OpenStreetMap Nominatim with a safe fallback to coordinates.
- The app now supports either local storage or Supabase-backed storage, depending on your environment variables.
- Remote Supabase image URLs are rendered in a deployment-safe way, so the gallery still works on Vercel without extra image host config.
- In production on Vercel, do not rely on local filesystem storage for uploaded images. Use Supabase Storage so photos persist across deployments.
