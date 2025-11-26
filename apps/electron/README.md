# InContact Electron App (LiveKitWrapper)

Electron desktop client that serves the **admin-web** React build statically, with MSAL (Azure AD) auth, Windows service integration, and a system tray.

---

## 🚀 Getting Started

Install dependencies before running any script. Do this once per environment or whenever dependencies change.

```bash
cd apps/admin-web
npm install

cd ../electron
npm install
```

With that in place, the commands defined in both `package.json` files will find their dependencies without warnings.

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

* **Development (`npm start`)**

  * `admin-web` runs on the **Vite dev server** at `http://localhost:5173`.
  * Electron waits for that URL and loads it directly.
* **Production (`npm run start:prod` or installer builds)**

  * `admin-web` is built with **`vite build --mode electron`** into `apps/admin-web/dist`.
  * During packaging, that `dist/` folder is copied into the Electron app under:

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
    * `http://localhost:3000` (production desktop)
  * Use Authorization Code + PKCE (MSAL Browser)
  * API scope must match `VITE_AZURE_AD_API_SCOPE_URI`

> You do **not** need the “Mobile & desktop” platform unless you move to `msal-node`/`msal-electron`. With MSAL React in the renderer, treat this as an **SPA**.

---

## 🔐 Environment variables

Create **`apps/admin-web/.env.electron`**. This file is loaded by Vite when you run `vite build --mode electron`.

Use the provided example (`apps/admin-web/.env.electron.example`) as your baseline and make sure every redirect URI in Electron mode points to **http://localhost:3000**.

**Example `apps/admin-web/.env.electron`:**

```ini
# Azure AD (SPA) — client & tenant
VITE_AZURE_AD_CLIENT_ID=9880433c-29f6-4522-a215-7bac089aa27c
VITE_AZURE_AD_TENANT_ID=a080ad22-43aa-4696-b40b-9b68b702c9f3
VITE_AZURE_AD_REDIRECT_URI=http://localhost:3000/
VITE_AZURE_AD_POST_LOGOUT_REDIRECT_URI=http://localhost:3000/
VITE_AZURE_AD_API_CLIENT_ID=875c2631-358c-4324-a128-1de60fb894a4
VITE_AZURE_AD_API_SCOPE_URI=api://a080ad22-43aa-4696-b40b-9b68b702c9f3/livekit-app-prod-API/access_as_user  # change it to your api scope uri
VITE_API_URL=https://livekit-agent-azure-func.azurewebsites.net
NODE_ENV=production
VITE_AZURE_AD_DESKTOP_REDIRECT_URI=http://localhost:3000/
VITE_IS_ELECTRON=TRUE
```

> Only variables prefixed with `VITE_` are exposed to the frontend bundle.
> Keep `http://localhost:3000/` for redirect URIs in Electron **production**.

---

## 🧩 Scripts (Electron)

`apps/electron/package.json`:

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
* Requires `.env.electron` and the dependencies installed (see [Getting Started](#-getting-started))

---

## 📦 Build Installers

Generate installers from the `apps/electron` directory. All commands reuse the React build under `apps/admin-web/dist`, so there is no need to run Vite separately.

```bash
npm run build         # Packages the Electron app and prepares artifacts
npm run dist:exe      # Produces a Windows installer (.exe) using NSIS
npm run dist:msi      # Produces a Windows installer (.msi)
npm run dist:win      # Builds both NSIS (.exe) and MSI outputs in one go
```

> Tip: electron-builder downloads NSIS and the required binaries automatically. All you need is Windows 10+ with PowerShell; if your antivirus blocks the downloads, whitelist them.

Finished installers are written to `apps/electron/dist/`. After running any of the commands above you should see, for example:

```
dist/
├─ In Contact App Setup.exe    # NSIS-based installer
├─ In Contact App-1.0.0.msi    # MSI installer
└─ win-unpacked/               # Portable unpacked build for inspection or debugging
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
