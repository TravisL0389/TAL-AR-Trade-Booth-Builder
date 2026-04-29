
# AR Trade Show Booth Builder

This folder is now the merged, active app. The standalone `/Users/travislangolf/Desktop/Boothbuilder` work has been integrated into this codebase's routed TypeScript app shell.

## What's merged

- Real booth planning state shared across builder and AR preview
- Drag, place, rotate, duplicate, and delete interactions
- Template-based booth presets
- Autosave and shareable AR handoff links
- Optional Supabase-backed cloud project library for saved booth snapshots
- Camera-overlay rehearsal fallback
- Live WebXR launcher for compatible devices

## Main files

- `src/app/components/Builder.tsx`
- `src/app/components/BoothCanvas.tsx`
- `src/app/components/ARPreview.tsx`
- `src/app/components/SmartAssistant.tsx`
- `src/app/lib/boothBuilder.ts`
- `src/app/lib/mountArScene.ts`

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Cloud project saves are optional. If you add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, the builder can save named layout snapshots to Supabase in addition to its existing local autosave and share-link flow.

Apply `supabase/migrations/20260429_booth_project_library.sql` to enable the cloud library table.

## Verification

```bash
npm run typecheck
npm run build
npm audit --omit=dev
```
  
