// main.js
const { app, BrowserWindow, session, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const fs   = require('fs');
// Service import removed; now using node-windows dynamically below

const APP_NAME       = 'InContact';
const SERVICE_NAME   = 'InContactService';
const SERVICE_DESC   = 'InContact background service';
const PORT           = 3000;
const DIST_FOLDER    = path.join(__dirname, 'ui', 'dist');
const HAS_DIST       = fs.existsSync(DIST_FOLDER);
const IS_PROD        = process.env.NODE_ENV === 'production' || HAS_DIST;
const START_URL      = IS_PROD
  ? `file://${path.join(DIST_FOLDER, 'index.html')}`
  : `http://localhost:${PORT}`;

let mainWindow = null;
let tray       = null;
let allowQuit  = false;

// ----------------------------------------
// 1) Service install/uninstall handling (using node-windows)
// ----------------------------------------

/**
 * Installs the Electron application as a Windows service.
 *
 * @remarks
 * This block runs when the process is launched with `--install-service`.
 * It dynamically loads `node-windows`, creates a Service instance,
 * installs it, and starts it immediately upon installation.
 */
if (process.argv.includes('--install-service')) {
  const { Service } = require('node-windows');
  /** @type {import('node-windows').Service} */
  const svc = new Service({
    name:        SERVICE_NAME,
    description: SERVICE_DESC,
    script:      path.join(__dirname, 'main.js'),
    // args: ['--hidden'], // you can uncomment if you need to pass flags
  });

  svc.on('install', () => svc.start());
  svc.install();
  return;
}

/**
 * Uninstalls the Windows service created by this Electron app.
 *
 * @remarks
 * This block runs when the process is launched with `--uninstall-service`.
 * It dynamically loads `node-windows`, references the service by name,
 * and removes it from the system.
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

// ----------------------------------------
// 2) Persistence setup (electron-store)
// ----------------------------------------
let store;
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

ipcMain.on('storage-clear', () => {
  if (store) {
    store.clear();          // Borra todo el contenido del electron-store
    console.log('✅ Electron store cleared');
  }
});

// ----------------------------------------
// 3) Express static server in production
// ----------------------------------------
if (IS_PROD) {
  const express = require('express');
  const server  = express();
  server.use(express.static(DIST_FOLDER));
  server.get('*', (_req, res) =>
    res.sendFile(path.join(DIST_FOLDER, 'index.html'))
  );
  server.listen(PORT, () =>
    console.log(`✔️  UI (build) served at http://localhost:${PORT}`)
  );
} else {
  console.log('🛠  Dev — waiting on Vite…');
}

// ----------------------------------------
// 4) Create main BrowserWindow
// ----------------------------------------
async function createWindow() {
  await setupPersistence();

  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    closable: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration:  false,
      preload:         path.join(__dirname, 'preload.js'),
      nativeWindowOpen:true,
    },
  });
  console.log('Loading:', START_URL);
  mainWindow.loadURL(START_URL);

  session.defaultSession.setPermissionRequestHandler((_, perm, cb) =>
    cb(perm === 'media') 
  );

  if (!IS_PROD) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  // never close: minimize instead
  mainWindow.on('close', e => {
    e.preventDefault();
    mainWindow.minimize();
  });

  // system tray menu
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
        }
      }
    ]);
    tray.setToolTip(APP_NAME);
    tray.setContextMenu(menu);
  } catch (err) {
    console.warn('[Tray] failed to set up tray icon:', err.message);
  }

  // hide window on successful login
  ipcMain.on('login-success', () => {
    mainWindow.hide();
  });
}

// ----------------------------------------
// 5) App lifecycle
// ----------------------------------------
app.whenReady().then(() => {
  // if not running as service, also auto-start at login
  if (process.platform === 'win32' && !process.argv.includes('--hidden')) {
    app.setLoginItemSettings({
      openAtLogin: true,
      path: process.execPath,
      args: ['--hidden']
    });
  }
  createWindow();
});

// block any programmatic quit
app.on('before-quit', e => {
  if (!allowQuit) e.preventDefault();
});

// on macOS re-activate
app.on('activate', () => {
  if (!mainWindow) createWindow();
  else mainWindow.show();
});

// do not quit when all windows are closed
app.on('window-all-closed', () => {
  // no-op
});
