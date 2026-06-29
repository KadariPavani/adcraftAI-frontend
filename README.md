# adcraftAI-frontend

Vite + React + TS + Tailwind frontend for AdCraft AI. Uses Supabase for auth, db and edge functions.

Backend code lives here: https://github.com/KadariPavani/adcraftAI-backend

## Run locally

```sh
npm install
npm run dev
```

Open http://localhost:8080

## Deploy on Vercel

1. Go to https://vercel.com/new and import this repo
2. Framework is auto-detected as Vite
3. Click Deploy

Env vars are already in `.env` (Supabase URL + anon key), so it works out of the box. If you want to override them in Vercel, set:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

`vercel.json` handles SPA routing.
