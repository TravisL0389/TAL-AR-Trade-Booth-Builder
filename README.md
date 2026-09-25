<<<<<<< HEAD
# Spatial Studio 2026

Responsive 3D spatial planning for trade show booths, offices, bedrooms, bathrooms, living rooms, kitchens, dining rooms, and whole-home concepts. The editor uses Three.js for the primary workspace, provides WebXR/camera AR handoff, and keeps React Three Fiber and Babylon diagnostics opt-in.

## Local Development

```bash
npm install
npm run dev -- --host 127.0.0.1 --port 5177
```

Open `http://127.0.0.1:5177/`.
=======

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
- Vercel SPA rewrites and AR-friendly permissions headers

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

## AR setup

The AR flow is production-wired for web deployment:

- `src/app/components/ARPreview.tsx`
  - Handles support detection, share-link handoff, camera rehearsal, and live AR launch.
- `src/app/lib/mountArScene.ts`
  - Mounts the Three.js / WebXR scene, hit-test reticle, and full-scale booth placement flow.
- `vercel.json`
  - Rewrites app routes to `index.html` and adds a `Permissions-Policy` header for camera and XR spatial tracking on your own origin.

For best results:

- deploy over HTTPS, which Vercel provides automatically
- test immersive AR on a mobile browser with WebXR support
- allow camera permission when prompted
- use the camera fallback when immersive AR is unavailable
>>>>>>> origin/main

## Verification

```bash
<<<<<<< HEAD
npm run lint
npm run test
npm run build
```

The browser QA script expects a Chromium DevTools endpoint and a running app:

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --headless=new \
  --remote-debugging-port=9226 \
  --use-angle=swiftshader \
  --enable-unsafe-swiftshader \
  --enable-webgl \
  --ignore-gpu-blocklist \
  about:blank

npm run qa:browser
```

Set `APP_URL` or `CDP_URL` to test different local addresses. The QA run preserves autosaved project data. Use `RESET_PROJECT_AFTER_QA=1 npm run qa:browser` only when a clean default project is desired afterward.

## AR And Render Stacks

- WebXR requires HTTPS or localhost and a compatible mobile browser/device.
- Unsupported devices receive camera preview and share-link fallbacks.
- The production editor loads Three.js and AR only when needed.
- Add `?renderStack=1` to load the optional React Three Fiber and Babylon diagnostics probes.
- `babylonNativeScene.js` is the shared Babylon Native scene contract for a future native shell; it is not executed in the browser bundle.

## Vercel

Use the Vite defaults: build command `npm run build`, output directory `dist`, and Node.js 22 or newer. No application environment variables are required.
=======
npm run typecheck
npm run build
npm audit --omit=dev
```
  
>>>>>>> origin/main
