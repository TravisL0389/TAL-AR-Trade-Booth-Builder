
# AR Trade Show Booth Builder

This folder is now the merged, active app. The standalone `/Users/travislangolf/Desktop/Boothbuilder` work has been integrated into this codebase's routed TypeScript app shell.

## What's merged

- Real booth planning state shared across builder and AR preview
- Drag, place, rotate, duplicate, and delete interactions
- Template-based booth presets
- Autosave and shareable AR handoff links
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
npm run dev
```

## Verification

```bash
npm run typecheck
npm run build
npm audit --omit=dev
```
  
