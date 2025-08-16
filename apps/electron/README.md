# InContact Electron App (LiveKitWrapper)

Electron desktop client that serves the **admin-web** React build statically, with MSAL (Azure AD) auth, Windows service integration, and a system tray.

---

## 📂 Monorepo Layout (relevant parts)

```
apps/
├─ admin-web/           # React app (Vite)
│  ├─ .env.electron     # ← Electron (prod) env vars (you must create this)
│  └─ dist/             # ← Built UI output (vite build --mode electron)
└─ electron/            # Electron shell
   ├─ main.js           # Express server (prod), BrowserWindow, tray, service hooks
   ├─ preload.js        # LocalStorage <-> electron-store bridge
   └─ package.json      # Scripts wire up admin-web dev/build via npm --prefix
```

---

## ⚙️ How it works

* **Development**

  * `admin-web` runs on **Vite dev server** at `http://localhost:5173`.
  * Electron waits for that URL and loads it directly.
* **Production**

  * `admin-web` is built with **`vite build --mode electron`** into `apps/admin-web/dist`.
  * During packaging, that `dist/` is copied into the Electron app under:

    ```
    <app>/resources/admin-web
    ```
  * **Electron’s `main.js`** starts **Express** on **`http://localhost:3000`**, serving those static files, with a catch-all route to `index.html`.
  * The BrowserWindow opens `http://localhost:3000`.

> In short: **Electron serves the UI statically** from `admin-web/dist` via Express in production.

---

## ✅ Prerequisites

* Node.js 18+ and npm
* Windows 10+ (for Windows service support)
* **Azure AD App Registration** (SPA):

  * Add **Redirect URIs**:

    * `http://localhost:5173` (dev)
    * `http://localhost:3000` (prod desktop)
  * Use Authorization Code + PKCE (MSAL Browser)
  * API scope must match `VITE_AZURE_AD_API_SCOPE_URI`

> You do **not** need “Mobile & desktop” platform unless you move to `msal-node/msal-electron`. With MSAL React inside the renderer, treat this as **SPA**.

---

## 🔐 Environment variables

Create **`apps/admin-web/.env.electron`**. This file is loaded by Vite when you run `vite build --mode electron`.

Use the provided example (`apps/admin-web/.env.electron.example`) as your baseline and ensure **localhost uses port 3000** in redirect URIs.

**Example `apps/admin-web/.env.electron`:**

```ini
# Azure AD (SPA) — client & tenant
VITE_AZURE_AD_CLIENT_ID=
VITE_AZURE_AD_TENANT_ID=

# Redirect URIs (must match Azure app registration EXACTLY)
VITE_AZURE_AD_REDIRECT_URI=http://localhost:3000/
VITE_AZURE_AD_POST_LOGOUT_REDIRECT_URI=http://localhost:3000/
VITE_AZURE_AD_DESKTOP_REDIRECT_URI=http://localhost:3000/

# Backend/API
VITE_AZURE_AD_API_CLIENT_ID=   # Client ID of the API app registration (backend)
VITE_AZURE_AD_API_SCOPE_URI=api://a080ad22-43aa-4696-b40b-9b68b702c9f3/livekit-app-prod-API/access_as_user
VITE_API_URL=                  # Your production API base URL

# Build/runtime hints
NODE_ENV=production
VITE_IS_ELECTRON=TRUE          # Case-insensitive; "true"/"TRUE" both work
```

> Only variables prefixed with `VITE_` are exposed to the frontend bundle.
> Keep `http://localhost:3000/` for redirect URIs in Electron **production**.

---

## 🧩 Scripts (Electron)

`apps/electron/package.json` :

```json
{
  "name": "in-contact-app",
  "version": "1.0.0",
  "main": "main.js",
  "author": "Softcial",
  "description": "In Contact Electron App for Collette Health",
  "scripts": {
    "start": "concurrently \"npm:ui:dev\" \"wait-on http://localhost:5173 && electron .\"",
    "ui:dev": "npm --prefix ../admin-web run dev",
    "ui:build": "npm --prefix ../admin-web run build:electron",
    "start:prod": "npm run ui:build && cross-env NODE_ENV=production electron .",
    "postinstall": "electron . --install-service",
    "postuninstall": "electron . --uninstall-service",
    "build": "npm run ui:build && electron-builder",
    "dist:exe": "npm run ui:build && electron-builder --win nsis",
    "dist:msi": "npm run ui:build && electron-builder --win msi",
    "dist:win": "npm run ui:build && electron-builder --win nsis,msi"
  },
  "build": {
    "appId": "com.example.livekitwrapper",
    "productName": "In Contact App",
    "icon": "icon",
    "directories": { "output": "dist" },
    "files": [
      "main.js",
      "preload.js",
      "assets/**/*"
    ],
    "extraResources": [
      { "from": "../admin-web/dist", "to": "admin-web", "filter": ["**/*"] }
    ],
    "win": {
      "target": ["nsis", "msi"],
      "protocols": [{ "name": "MyApp Protocol", "schemes": ["myapp"] }]
    }
  },
  "devDependencies": {
    "concurrently": "^9.2.0",
    "cross-env": "^7.0.3",
    "electron": "^28.3.3",
    "electron-builder": "^26.0.12",
    "wait-on": "^8.0.3"
  },
  "dependencies": {
    "electron-store": "^10.1.0",
    "express": "^4.19.2",
    "livekit-client": "^2.13.8",
    "node-windows": "^1.0.0-beta.8",
    "react-router-dom": "^7.6.2"
  },
  "overrides": { "minimatch": "3.1.2" }
}
```

**`apps/admin-web/package.json`** must define:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:electron": "vite build --mode electron",
    "preview": "vite preview"
  },
  "devDependencies": {
    "vite": "^6.3.0"
  }
}
```

---

## ▶️ Run

### Dev

```bash
cd apps/electron
npm install
npm start
```

* Starts `admin-web` at `http://localhost:5173`
* Launches Electron pointing to that URL

### Prod (local)

```bash
cd apps/electron
npm run start:prod
```

* Builds `admin-web` with `--mode electron` (consuming `.env.electron`)
* Starts Express at `http://localhost:3000`
* Launches Electron pointing at `http://localhost:3000`

---

## 📦 Build Installers

From `apps/electron`:

```bash
npm run build         # package app (includes admin-web/dist via extraResources)
npm run dist:exe      # Windows NSIS installer (.exe)
npm run dist:msi      # Windows MSI installer (.msi)
npm run dist:win      # Both
```

Output: `apps/electron/dist/`

```
dist/
├─ In Contact App Setup.exe
├─ In Contact App-1.0.0.msi
└─ win-unpacked/
```

---

## 🧰 Debugging

* **DevTools**: `Ctrl+Shift+I`
* Watch the Electron console for:

  * `✔️ UI (build) served at http://localhost:3000` (prod)
  * `Loading: http://localhost:5173` or `http://localhost:3000`
* If you ever see `ERR_FILE_NOT_FOUND` trying to open `/login`, it means you’re loading `file://` with `BrowserRouter`. This setup avoids that by using HTTP (Vite/Express).

---

## 🔒 Notes on MSAL

* Keep `redirectUri` and `postLogoutRedirectUri` aligned with **the origin you load**:

  * Dev: `http://localhost:5173/`
  * Prod: `http://localhost:3000/`
* In your MSAL config, using `redirectUri: window.location.origin` is safe so long as the Azure app registration has both URLs registered.

---

## ✅ Summary

* Electron **serves the UI statically** from `admin-web/dist` via Express on **port 3000** in production.
* Create **`apps/admin-web/.env.electron`** (based on `.env.electron.example`) and ensure **all redirect URIs use `http://localhost:3000/`**.
* Use the provided scripts to **build, run, and package** the app cleanly from the Electron folder.
