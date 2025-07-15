# InContact Electron App (LiveKitWrapper)

This README explains how to configure, run, debug, and build the Electron desktop application located in `apps/electron/` of the LiveKit MonoRepo.

---

## 📋 Overview

* **App name:** LiveKitWrapper (InContact)
* **Version:** 1.0.0
* **Author:** Softcial
* **Description:** Electron desktop client with LiveKit streaming, MSAL authentication, Windows service installation, and system tray integration.

---

## ⚙️ Prerequisites

* Node.js v16 or later
* npm
* Windows 10+ (for Windows service support)
* Azure AD App Registration with:

  * **Single-page application** platform: Redirect URI `http://localhost:3000`
  * **Mobile and desktop applications** platform: Redirect URI `http://localhost:3000/auth` (or custom protocol)
  * **API scope** URI matching `VITE_AZURE_AD_API_SCOPE_URI`
  * **Allow public client flows** enabled

---

## 🗄️ Environment Variables

Create a `.env.production` file in **both** `apps/electron/` and `apps/electron/ui/` folders.

### apps/electron/.env.production

```ini
VITE_AZURE_AD_CLIENT_ID=77f51a07-cf87-4c12-b15e-5a463ed9c839
VITE_AZURE_AD_TENANT_ID=a080ad22-43aa-4696-b40b-9b68b702c9f3
VITE_AZURE_AD_REDIRECT_URI=http://localhost:3000/
VITE_AZURE_AD_POST_LOGOUT_REDIRECT_URI=http://localhost:3000/
VITE_AZURE_AD_DESKTOP_REDIRECT_URI=http://localhost:3000/

VITE_AZURE_AD_API_CLIENT_ID=95cd1cad-5472-4796-a35d-91207159e148
VITE_AZURE_AD_API_SCOPE_URI=api://a080ad22-43aa-4696-b40b-9b68b702c9f3/in-contact-app-prod-API/access_as_user
VITE_API_URL=https://in-contact-app-func.azurewebsites.net

NODE_ENV=production
```

### apps/electron/ui/.env.production

```ini
VITE_AZURE_AD_CLIENT_ID=77f51a07-cf87-4c12-b15e-5a463ed9c839
VITE_AZURE_AD_TENANT_ID=a080ad22-43aa-4696-b40b-9b68b702c9f3
VITE_AZURE_AD_REDIRECT_URI=http://localhost:3000
VITE_AZURE_AD_POST_LOGOUT_REDIRECT_URI=http://localhost:3000/
VITE_AZURE_AD_DESKTOP_REDIRECT_URI=http://localhost:3000/

VITE_AZURE_AD_API_CLIENT_ID=95cd1cad-5472-4796-a35d-91207159e148
VITE_AZURE_AD_API_SCOPE_URI=api://a080ad22-43aa-4696-b40b-9b68b702c9f3/in-contact-app-prod-API/access_as_user
VITE_API_URL=https://in-contact-app-func.azurewebsites.net
```

> **Important:** All redirect URIs (including `DESKTOP_REDIRECT_URI`) must exactly match your Azure AD App Registration (trailing slash matters).

---

## 🚀 Running the App

### Development Mode

```bash
cd apps/electron
npm install
npm start
```

* Launches Vite dev server on `http://localhost:5173`
* Waits for UI, then opens Electron in dev mode

### Production Mode

```bash
cd apps/electron
npm install
npm run start:prod
```

* Builds the UI into `apps/electron/ui/dist`
* Sets `NODE_ENV=production`
* Starts an Express server serving the built UI on port 3000
* Opens Electron pointed at `http://localhost:3000`

---

## 🛠️ Debugging in Electron

* Open Developer Tools with **Ctrl+Shift+I** (Windows).
* In the Developer Tools you can inspect console logs, network requests, and WebSocket traffic.
* Use `console.log()` in your renderer or preload scripts to trace application state.

---

## 🏗️ Build & Distribution

From the `apps/electron` folder:

```bash
npm run build         # compile UI & package with electron-builder
npm run dist:exe      # build Windows NSIS installer (.exe)
npm run dist:msi      # build Windows MSI installer (.msi)
npm run dist:win      # build both NSIS and MSI
```

Output appears in `apps/electron/dist/`:

```
apps/electron/dist/
├── LiveKitWrapper-1.0.0.msi
├── LiveKitWrapper Setup.exe
├── win-unpacked/  # unpacked app
└── builder-effective-config.yaml
```



---

## 🔑 Key npm Scripts

```json
{
  "scripts": {
    "start":      "concurrently \"npm:ui:dev\" \"wait-on http://localhost:5173 && electron .\"",
    "ui:dev":     "cd ui && npm run dev",
    "ui:build":   "cd ui && npm run build",
    "start:prod": "npm run ui:build && cross-env NODE_ENV=production electron .",
    "build":      "npm run ui:build && electron-builder",
    "dist:exe":   "npm run ui:build && electron-builder --win nsis",
    "dist:msi":   "npm run ui:build && electron-builder --win msi",
    "dist:win":   "npm run ui:build && electron-builder --win nsis,msi"
  }
}
```

## 🔑 Creating the msi

Please be sure that you have already filled and test your enviroment variables and the application by running "start:prod", if everything went well you can proceed and create the msi or a .exe by running previous scripts


---

## 🛡️ Features

* **Windows Service**: auto-installs/uninstalls with postinstall scripts
* **System Tray**: minimize to tray, quick actions via context menu
* **MSAL Auth**: popup in dev, redirect with `prompt=select_account` in prod
* **LiveKit Streaming**: real-time video/audio
* **Persistence**: `electron-store` syncs `localStorage` via IPC

---

## 📖 Further Reading

* [LiveKit App MonoRepo Wiki](https://github.com/SoftcialDev/LivekitAppMonoRepo/wiki)
* [Electron Builder Documentation](https://www.electron.build/)
* [MSAL.js Browser Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js)
