/**
 * @file Main process for an Electron app that:
 *  - Can install/uninstall itself as a Windows service (via node-windows)
 *  - Persists renderer localStorage to disk (via electron-store)
 *  - Serves a built UI in production (or defers to a dev server in development)
 *  - Creates a single hidden-on-close window and a system tray with a guarded Quit option
 */

const { app, BrowserWindow, session, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const fs   = require('fs');
// Service import intentionally omitted; loaded dynamically in service branches below.

const APP_NAME       = 'InContact';
const SERVICE_NAME   = 'InContactService';
const SERVICE_DESC   = 'InContact background service';
const PORT           = 3000;
const DIST_FOLDER    = path.join(__dirname, 'ui', 'dist');
const HAS_DIST       = fs.existsSync(DIST_FOLDER);
const IS_PROD        = process.env.NODE_ENV === 'production' || HAS_DIST;
/** Start URL: file:// index.html in prod, Vite at localhost in dev. */
const START_URL = `http://localhost:${PORT}`;

let mainWindow = null;
let tray       = null;
/** Set to true by the tray "Quit" action to allow process exit. */
let allowQuit  = false;

// -------------------------------------------------------------------------------------------------
// 1) Windows service install/uninstall (node-windows)
// -------------------------------------------------------------------------------------------------

/**
 * Install this Electron app as a Windows service.
 * Trigger by launching the executable with `--install-service`.
 *
 * Notes:
 * - The service is configured to run `main.js` and will start immediately after installation.
 * - Pass extra flags via `args` if the service should run headless/hidden.
 */
if (process.argv.includes('--install-service')) {
  const { Service } = require('node-windows');
  /** @type {import('node-windows').Service} */
  const svc = new Service({
    name:        SERVICE_NAME,
    description: SERVICE_DESC,
    script:      path.join(__dirname, 'main.js'),
    // args: ['--hidden'], // Uncomment if you need to pass flags to the service run
  });

  svc.on('install', () => svc.start());
  svc.install();
  return;
}

/**
 * Uninstall the Windows service created above.
 * Trigger by launching the executable with `--uninstall-service`.
 */
if (process.argv.includes('--uninstall-service')) {
  const { Service } = require('node-windows');
  /** @type {import('node-windows').Service} */
  const svc = new Service({ name: SERVICE_NAME });

  svc.on('uninstall', () => {
    console.log(`${SERVICE_NAME} has been uninstalled.`);
  });
  svc.uninstall();
  return;
}

// -------------------------------------------------------------------------------------------------
// 2) Persistence (electron-store) — mirror renderer localStorage to disk
// -------------------------------------------------------------------------------------------------

/** Electron-store instance; created lazily in `setupPersistence()`. */
let store;

/**
 * Initialize persistence IPC handlers and store instance.
 * - `storage-save`: stores the full snapshot under key `localStorage`
 * - `storage-load`: returns the snapshot synchronously (used by preload's sendSync)
 */
async function setupPersistence() {
  const { default: Store } = await import('electron-store');
  store = new Store();

  ipcMain.on('storage-save', (_evt, data) => {
    store.set('localStorage', data);
  });

  ipcMain.on('storage-load', (evt) => {
    evt.returnValue = store.get('localStorage') || {};
  });
}

/**
 * Clear the persisted data. Note: `store.clear()` wipes the entire store,
 * not just the `localStorage` key. Use `store.delete('localStorage')` if
 * you want to limit the scope.
 */
ipcMain.on('storage-clear', () => {
  if (store) {
    store.clear();
    console.log('✅ Electron store cleared');
  }
});

// -------------------------------------------------------------------------------------------------
// 3) Static server in production (serves the built UI)
// -------------------------------------------------------------------------------------------------

if (IS_PROD) {
  const express = require('express');
  const server  = express();

  server.use(express.static(DIST_FOLDER));
  server.get('*', (_req, res) => res.sendFile(path.join(DIST_FOLDER, 'index.html')));

  server.listen(PORT, () => {
    console.log(`✔️  UI (build) served at http://localhost:${PORT}`);
  });
} else {
  console.log('🛠  Dev — waiting on Vite…');
}

// -------------------------------------------------------------------------------------------------
// 4) Main BrowserWindow
// -------------------------------------------------------------------------------------------------

/**
 * Create the main application window, wire up permissions, tray, and lifecycle.
 */
async function createWindow() {
  await setupPersistence();

  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    // Prevent the close button from actually closing the app; we’ll minimize instead.
    closable: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration:  false,
      preload:          path.join(__dirname, 'preload.js'),
      nativeWindowOpen: true,
    },
  });

  console.log('Loading:', START_URL);
  mainWindow.loadURL(START_URL);

  /**
   * Permission gate: allow only 'media' (camera/microphone) requests.
   * All other permission requests are denied.
   */
  session.defaultSession.setPermissionRequestHandler((_, perm, cb) => cb(perm === 'media'));

  // Open devtools in development for debugging.
  if (!IS_PROD) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  /**
   * Never quit on window close: minimize to tray instead.
   * This keeps the background service feel even when the UI is dismissed.
   */
  mainWindow.on('close', (e) => {
    e.preventDefault();
    mainWindow.minimize();
  });

  /**
   * System tray menu with guarded Quit action.
   * Note: The "Quit (Admin only)" label is cosmetic—no admin check is enforced here.
   */
  try {
    const trayIcon = path.join(__dirname, 'assets', 'icon.ico');
    if (!fs.existsSync(trayIcon)) throw new Error('Tray icon not found');

    tray = new Tray(trayIcon);
    const menu = Menu.buildFromTemplate([
      { label: `${APP_NAME}`, enabled: false },
      { type: 'separator' },
      { label: 'Show', click: () => mainWindow.show() },
      {
        label: 'Quit (Admin only)',
        click: () => {
          allowQuit = true;
          app.quit();
        },
      },
    ]);

    tray.setToolTip(APP_NAME);
    tray.setContextMenu(menu);
  } catch (err) {
    console.warn('[Tray] failed to set up tray icon:', err.message);
  }

  // Hide the window once the renderer tells us login succeeded.
  ipcMain.on('login-success', () => {
    mainWindow.hide();
  });
}

// -------------------------------------------------------------------------------------------------
// 5) App lifecycle
// -------------------------------------------------------------------------------------------------

app.whenReady().then(() => {
  /**
   * Auto-start at user login on Windows (unless launched with --hidden).
   * This only applies when not running as a service.
   */
  if (process.platform === 'win32' && !process.argv.includes('--hidden')) {
    app.setLoginItemSettings({
      openAtLogin: true,
      path: process.execPath,
      args: ['--hidden'],
    });
  }

  createWindow();
});

/**
 * Block programmatic quits unless the tray "Quit" was used.
 */
app.on('before-quit', (e) => {
  if (!allowQuit) e.preventDefault();
});

/**
 * macOS: re-create a window on dock icon click if none exists.
 */
app.on('activate', () => {
  if (!mainWindow) createWindow();
  else mainWindow.show();
});

/**
 * Keep the app alive even when all windows are closed (typical for tray apps).
 */
app.on('window-all-closed', () => {
  // no-op
});
