# AGENTS.md

## Project Overview
ZIA Event and Wedding Planner — a monorepo with two Vite + React apps using npm workspaces:
- `apps/customer` — public customer app (Smart Gadget Store + wedding/event booking), dev port 5173, exposed on host port 3000.
- `apps/admin` — private admin panel, dev port 5174, exposed on host port 8000.

Both apps connect to an **external Supabase project** via `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. When credentials are absent, `supabase` is `null` and both apps fall back to built-in demo data — they boot and render without a backend.

## Running in Base44
```bash
docker compose -f docker-compose.base44.yml up -d
```
- A `setup` service runs `npm install` once and exits; `customer` and `admin` depend on it (`service_completed_successfully`).
- Source is bind-mounted at `/app`; Vite runs with `watch.usePolling: true` for bind-mount HMR.
- Vite configs (`apps/customer/vite.config.js`, `apps/admin/vite.config.js`) were added — the project depended on `@vitejs/plugin-react` but had no config to load it.

## Secrets
- `VITE_SUPABASE_URL` — Supabase project URL (e.g. `https://<project>.supabase.co`). Required for live data; app falls back to demo data without it.
- `VITE_SUPABASE_ANON_KEY` — Supabase publishable anon key. Required for live data; app falls back to demo data without it.
- Both are delivered via `/run/base44/app.env` (platform-managed, outside the repo). Never use a service-role key in the frontends.

## Database
`supabase/schema.sql` defines all tables, RLS policies, and seed data. `supabase/production.sql` adds production seed data. Run both in the Supabase SQL Editor of the connected project. Admin access is granted by inserting a user's Auth UUID into `admin_users`.

## Android release APK (customer app)
The customer app is packaged for Android with Capacitor 7 (`capacitor.config.ts`, appId `pk.zia.eventplanner`). The `android/` platform project is generated and committed (build outputs are gitignored by `android/.gitignore`).

Build steps (run inside an image with JDK 21 + Android SDK 35, e.g. `mingc/android-build-box:latest`):
1. `npm --workspace apps/customer run build` → `apps/customer/dist`.
2. Capacitor needs **TypeScript 5.x** to read `capacitor.config.ts`; TypeScript 7 breaks the CLI's config loader. Install with `npm install --no-save typescript@5.4.5` (do not save — it is only a build-time need).
3. `npx cap add android` (first time only) then `npx cap sync android`.
4. `cd android && ./gradlew assembleRelease` → `app/build/outputs/apk/release/app-release-unsigned.apk` (the repo ships no signing config).
5. Sign for installability: `zipalign -p 4` then `apksigner sign` with a keystore, then `apksigner verify`.

The signed APK and keystore are served for download by the `artifacts` compose service (nginx on host port 8080, bind-mounting `/tmp/zia-release`).

## Verification
- `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/` → 200
- Customer app serves with Vite HMR + React Fast Refresh.
- Admin app serves on port 8000.
