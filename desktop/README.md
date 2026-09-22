# SmartStock Desktop Shell

Electron wrapper for the SmartStock Vite frontend. The desktop app is intentionally thin: it loads the built frontend and exposes only a narrow immutable configuration object to the renderer.

## Prerequisites

Build the frontend before running or packaging the desktop shell:

```bash
cd ../frontend
npm install
npm run build
```

The backend API defaults to `http://localhost:3000`.

## Configuration

- `SMARTSTOCK_API_BASE` — API base URL exposed to the renderer as `window.smartStockDesktop.apiBase`. Defaults to `http://localhost:3000`.
- `SMARTSTOCK_DESKTOP_DEV_URL` — optional Vite dev-server URL for local desktop development, for example `http://localhost:5173`.

No secrets, credentials, tokens, webhook URLs, or API keys should be placed in desktop configuration. The preload script does not expose broad Node APIs.

## Development

```bash
cd desktop
npm install
SMARTSTOCK_DESKTOP_DEV_URL=http://localhost:5173 npm run dev
```

If `SMARTSTOCK_DESKTOP_DEV_URL` is omitted, Electron loads `../frontend/dist/index.html`.

## Build

```bash
cd desktop
npm run build
```

This compiles `main.ts` and `preload.ts` into `desktop/dist/`.

## Package

Create an unpacked package for local verification:

```bash
cd desktop
npm run package
```

Windows installer packaging path:

```bash
cd desktop
npm run package:win
```

The Windows package is configured through `electron-builder` and writes artifacts under `desktop/release/`. Run it from Windows or a CI runner with the Windows packaging prerequisites installed.
