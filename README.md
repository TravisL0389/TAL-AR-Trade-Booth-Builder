# Spatial Studio 2026

Responsive 3D spatial planning for trade show booths, offices, bedrooms, bathrooms, living rooms, kitchens, dining rooms, and whole-home concepts. The editor uses Three.js for the primary workspace, provides WebXR/camera AR handoff, and keeps React Three Fiber and Babylon diagnostics opt-in.

## Local Development

```bash
npm install
npm run dev -- --host 127.0.0.1 --port 5177
```

Open `http://127.0.0.1:5177/`.

## Verification

```bash
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
