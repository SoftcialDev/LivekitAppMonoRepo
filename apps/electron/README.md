# InContact Electron App

Electron desktop application that serves the React web application statically with MSAL (Azure AD) authentication, Windows service integration, and system tray functionality.

## What is Electron?

Electron is a framework that allows building cross-platform desktop applications using web technologies (HTML, CSS, and JavaScript/TypeScript). It combines the Chromium rendering engine and Node.js runtime, enabling developers to create desktop apps that can access both web APIs and native operating system features.

### How We Use Electron

In this project, Electron serves as a desktop wrapper for the React web application (`apps/in-contact-web`). Instead of running the web app in a browser, Electron provides:

1. **Desktop Application Experience**: The React app runs as a native desktop application with its own window, system tray integration, and Windows service support
2. **Native OS Integration**: Access to Windows services, file system, and other native capabilities that are not available in a standard web browser
3. **Controlled Environment**: Consistent runtime environment across different machines without browser compatibility concerns
4. **Offline Capabilities**: Ability to serve the application locally without requiring an external web server (in production mode)

The Electron app does not rewrite the React application; it simply wraps it and provides a desktop container. All the React code, components, and business logic remain unchanged.

## Architecture Overview

The Electron app acts as a desktop wrapper for the React web application. In production, it serves the built React application statically via an Express server, while in development it loads the application from the Vite dev server.

### How It Works

**Development Mode:**
- React app runs on Vite dev server at `http://localhost:5173`
- Electron loads the application directly from the dev server URL
- Hot module replacement and fast refresh work as normal

**Production Mode:**
- React app is built with `vite build --mode electron` into `apps/admin-web/dist`
- During packaging, the `dist/` folder is copied into the Electron app under `resources/admin-web`
- Electron's `main.js` starts an Express server on `http://localhost:3000`, serving the static files
- BrowserWindow opens `http://localhost:3000`
- All routes are handled with a catch-all route to `index.html` for client-side routing

### Monorepo Layout

```
apps/
├── admin-web/              # React app (Vite)
│   ├── .env.electron      # Electron production env vars
│   └── dist/              # Built UI output (vite build --mode electron)
└── electron/              # Electron shell
    ├── main.js            # Express server (prod), BrowserWindow, tray, service hooks
    ├── preload.js         # LocalStorage <-> electron-store bridge
    └── package.json       # Scripts wire up admin-web dev/build via npm --prefix
```

## Prerequisites

Before running this project, ensure the following are installed:

- **Node.js 18+** and npm
- **Windows 10+** (for Windows service support)
- **Azure AD App Registration** configured as SPA:
  - Add Redirect URIs:
    - `http://localhost:5173` (development)
    - `http://localhost:3000` (production desktop)
  - Use Authorization Code + PKCE (MSAL Browser)
  - API scope must match `VITE_AZURE_AD_API_SCOPE_URI`

## Installation

Install dependencies in both applications:

```bash
cd apps/admin-web
npm install

cd ../electron
npm install
```

## Configuration

Create `apps/admin-web/.env.electron` file based on `.env.electron.example`:

```env
# Azure AD (SPA) - client & tenant
VITE_AZURE_AD_CLIENT_ID=your-client-id
VITE_AZURE_AD_TENANT_ID=your-tenant-id
VITE_AZURE_AD_REDIRECT_URI=http://localhost:3000/
VITE_AZURE_AD_POST_LOGOUT_REDIRECT_URI=http://localhost:3000/
VITE_AZURE_AD_API_CLIENT_ID=your-api-client-id
VITE_AZURE_AD_API_SCOPE_URI=api://your-api-id/access_as_user
VITE_API_URL=https://your-api-url.azurewebsites.net
NODE_ENV=production
VITE_AZURE_AD_DESKTOP_REDIRECT_URI=http://localhost:3000/
VITE_IS_ELECTRON=TRUE
```

Important configuration notes:
- Only variables prefixed with `VITE_` are exposed to the frontend bundle
- All redirect URIs in Electron production mode must use `http://localhost:3000/`
- The `VITE_IS_ELECTRON` flag can be used to detect Electron environment in the React app

## Scripts

### Development

```bash
cd apps/electron
npm start
```

This command:
- Starts the React app on Vite dev server at `http://localhost:5173`
- Waits for the server to be ready
- Launches Electron pointing to the dev server URL

### Production (Local Testing)

```bash
cd apps/electron
npm run start:prod
```

This command:
- Builds the React app with `--mode electron` (consuming `.env.electron`)
- Starts Express server at `http://localhost:3000`
- Launches Electron pointing at `http://localhost:3000`

### Building Installers

Generate Windows installers from the `apps/electron` directory:

```bash
# Package the Electron app and prepare artifacts
npm run build

# Produce Windows installer (.exe) using NSIS
npm run dist:exe

# Produce Windows installer (.msi)
npm run dist:msi

# Build both NSIS (.exe) and MSI outputs
npm run dist:win
```

All commands reuse the React build under `apps/admin-web/dist`, so there is no need to run Vite separately.

Finished installers are written to `apps/electron/dist/`:
```
dist/
├── In Contact App Setup.exe    # NSIS-based installer
├── In Contact App-1.0.0.msi    # MSI installer
└── win-unpacked/               # Portable unpacked build
```

## Script Reference

**`apps/electron/package.json` scripts:**

| Script                 | Description                                    |
| ---------------------- | ---------------------------------------------- |
| `start`                | Starts dev mode (Vite + Electron)              |
| `ui:dev`               | Starts React app on Vite dev server            |
| `ui:build`             | Builds React app for Electron                  |
| `start:prod`           | Builds React app and starts Electron in prod   |
| `build`                | Packages Electron app                          |
| `dist:exe`             | Creates NSIS installer (.exe)                  |
| `dist:msi`             | Creates MSI installer                          |
| `dist:win`             | Creates both NSIS and MSI installers           |
| `postinstall`          | Installs Windows service (if applicable)       |
| `postuninstall`        | Uninstalls Windows service (if applicable)     |

**`apps/admin-web/package.json` must define:**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:electron": "vite build --mode electron",
    "preview": "vite preview"
  }
}
```

## Windows Service Integration

The Electron app can be installed as a Windows service. The service integration is handled through command-line arguments:

- `electron . --install-service`: Installs the Windows service
- `electron . --uninstall-service`: Uninstalls the Windows service

These commands are automatically executed via `postinstall` and `postuninstall` npm scripts.

## Debugging

### DevTools

Open DevTools in Electron:
- Press `Ctrl+Shift+I` to open DevTools

### Console Output

Watch the Electron console for:
- `✔️ UI (build) served at http://localhost:3000` (production)
- `Loading: http://localhost:5173` or `http://localhost:3000`

### Common Issues

**ERR_FILE_NOT_FOUND trying to open `/login`:**
- This means you're loading `file://` with `BrowserRouter`
- This setup avoids that by using HTTP (Vite/Express)

**Redirect URI mismatch:**
- Ensure all redirect URIs in `.env.electron` point to `http://localhost:3000/`
- Verify Azure AD app registration has both `http://localhost:5173` and `http://localhost:3000` registered

## MSAL Configuration Notes

Keep `redirectUri` and `postLogoutRedirectUri` aligned with the origin you load:

- **Development**: `http://localhost:5173/`
- **Production**: `http://localhost:3000/`

In MSAL config, using `redirectUri: window.location.origin` is safe so long as the Azure app registration has both URLs registered.

## Architecture Details

### Main Process (`main.js`)

The main process handles:
- Express server (production mode only)
- BrowserWindow creation and management
- System tray functionality
- Windows service integration
- Application lifecycle management

### Preload Script (`preload.js`)

The preload script provides:
- Bridge between renderer process and Node.js APIs
- LocalStorage to electron-store synchronization
- Secure API exposure to renderer process

### Express Server (Production)

In production mode, the Express server:
- Serves static files from `resources/admin-web` directory
- Provides catch-all route to `index.html` for client-side routing
- Runs on `http://localhost:3000`
- Only started in production mode

## Key Dependencies

| Package            | Purpose                          |
| ------------------ | -------------------------------- |
| `electron`         | Electron framework               |
| `express`          | Static file server (production)  |
| `electron-store`   | Persistent storage               |
| `node-windows`     | Windows service integration      |
| `electron-builder` | Installer generation             |
| `concurrently`     | Run multiple scripts             |
| `wait-on`          | Wait for server to be ready      |
| `cross-env`        | Cross-platform env vars          |

## Notes

- Electron serves the UI statically from `admin-web/dist` via Express on port 3000 in production
- Create `apps/admin-web/.env.electron` based on `.env.electron.example`
- Ensure all redirect URIs use `http://localhost:3000/` in Electron production mode
- Use the provided scripts to build, run, and package the app cleanly
- DevTools accessible via `Ctrl+Shift+I`
- Windows service integration available via command-line arguments
- All routes handled with catch-all to `index.html` for client-side routing support
