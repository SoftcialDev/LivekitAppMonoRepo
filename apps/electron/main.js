/**
 * @file Electron main process (with verbose logging).
 *
 * @overview
 * In development:
 *   - Loads Vite dev server at http://localhost:5173
 *
 * In production (packaged MSI/EXE):
 *   - Starts an internal Express server on an available port (prefers 3000)
 *   - Serves static files from:
 *       • <app>/resources/admin-web   (copied via electron-builder extraResources)
 *       • Fallback (for local prod runs): ../admin-web/dist
 *   - Chooses the correct start URL and opens it in the BrowserWindow
 *
 * Extras:
 *   - node-windows service hooks (install/uninstall)
 *   - persisted storage bridge (electron-store)
 *   - tray with guarded Quit
 *   - detailed logging to console and to a file (userData/main.log)
 */

const { app, BrowserWindow, session, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

// ----------------------------- Logging ---------------------------------

/** Buffered logger that writes to console and (once ready) to a file. */
let logFilePath = null;
const logBuffer = [];

/** Formats and writes a log line. */
function writeLogLine(level, args) {
  const ts = new Date().toISOString();
  const msg = `[${ts}] [${level}] ${args.map(String).join(' ')}`;
  // Console
  if (level === 'ERROR') console.error(msg);
  else console.log(msg);
  // File (if available) or buffer
  if (logFilePath) {
    try { fs.appendFileSync(logFilePath, msg + '\n'); } catch {}
  } else {
    logBuffer.push(msg);
  }
}
const log = (...a) => writeLogLine('INFO', a);
const warn = (...a) => writeLogLine('WARN', a);
const error = (...a) => writeLogLine('ERROR', a);

/** Attach file sink once app is ready and userData is available. */
function attachFileLogger() {
  try {
    logFilePath = path.join(app.getPath('userData'), 'main.log');
    // Flush buffer
    for (const line of logBuffer) {
      try { fs.appendFileSync(logFilePath, line + '\n'); } catch {}
    }
    logBuffer.length = 0;
    log('📝 Log file:', logFilePath);
  } catch (e) {
    warn('Could not attach file logger:', e?.message || e);
  }
}

// --------------------------- Constants ---------------------------------

const APP_NAME = 'InContact';
const SERVICE_NAME = 'InContactService';
const SERVICE_DESC = 'InContact background service';

const DEV_PORT = 5173; // Vite
const PREF_PROD_PORT = 3000; // Express preferred

// Static roots for production (packaged vs local fallback)
const ADMIN_WEB_DIST_PROD  = path.join(process.resourcesPath, 'admin-web');
const ADMIN_WEB_DIST_LOCAL = path.join(__dirname, '..', 'admin-web', 'dist');

// ✅ Robust production detection: packaged binaries always true
const IS_PROD = app.isPackaged || process.env.NODE_ENV === 'production';

let mainWindow = null;
let tray = null;
let allowQuit = false;

// --------------------- Service install/uninstall -----------------------

if (process.argv.includes('--install-service')) {
  const { Service } = require('node-windows');
  const svc = new Service({
    name: SERVICE_NAME,
    description: SERVICE_DESC,
    script: path.join(__dirname, 'main.js'),
  });
  svc.on('install', () => svc.start());
  svc.install();
  // Do not continue running in foreground
  return;
}

if (process.argv.includes('--uninstall-service')) {
  const { Service } = require('node-windows');
  const svc = new Service({ name: SERVICE_NAME });
  svc.on('uninstall', () => log(`${SERVICE_NAME} has been uninstalled.`));
  svc.uninstall();
  return;
}

// ------------------------- Persistence (IPC) ---------------------------

let store; // electron-store instance

async function setupPersistence() {
  const { default: Store } = await import('electron-store');
  store = new Store();

  ipcMain.on('storage-save', (_evt, data) => {
    log('IPC storage-save received, keys:', Object.keys(data || {}).length);
    store.set('localStorage', data);
  });

  ipcMain.on('storage-load', (evt) => {
    const snapshot = store.get('localStorage') || {};
    log('IPC storage-load returning, keys:', Object.keys(snapshot).length);
    evt.returnValue = snapshot;
  });

  ipcMain.on('storage-clear', () => {
    if (store) {
      store.clear(); // or store.delete('localStorage')
      log('✅ Electron store cleared via IPC');
    }
  });
}

// ---------------------- Static server (production) ---------------------

/**
 * Resolves the static root (packaged vs local fallback) and validates index.html.
 * @returns {{ staticRoot: string, indexPath: string, ok: boolean }}
 */
function resolveStaticRoot() {
  const candidate = fs.existsSync(ADMIN_WEB_DIST_PROD)
    ? ADMIN_WEB_DIST_PROD
    : ADMIN_WEB_DIST_LOCAL;

  const indexPath = path.join(candidate, 'index.html');
  const ok = fs.existsSync(indexPath);
  if (!ok) {
    error('❌ index.html NOT found at:', indexPath);
    error('   Expected admin-web dist at:', ADMIN_WEB_DIST_PROD, 'or', ADMIN_WEB_DIST_LOCAL);
  } else {
    log('📦 Serving admin-web from:', candidate);
    log('✅ index.html found:', indexPath);
  }
  return { staticRoot: candidate, indexPath, ok };
}

/**
 * Starts Express on the preferred port, with retry on EADDRINUSE.
 * @param {string} staticRoot
 * @param {string} indexPath
 * @returns {Promise<string>} The final base URL (e.g., http://localhost:3000)
 */
function startExpress(staticRoot, indexPath) {
  return new Promise((resolve) => {
    const express = require('express');
    const server  = express();

    server.use((req, _res, next) => { log('HTTP', req.method, req.url); next(); });
    server.use(express.static(staticRoot));
    server.get('*', (_req, res) => res.sendFile(indexPath));

    const tryListen = (port) => {
      const s = server.listen(port, () => {
        const url = `http://localhost:${port}`;
        log(`✔️ UI (build) served at ${url}`);
        resolve(url);
      });
      s.on('error', (err) => {
        if (err && err.code === 'EADDRINUSE') {
          warn(`Port ${port} in use, retrying on a random port...`);
          const fallback = server.listen(0, () => {
            const used = fallback.address().port;
            const url = `http://localhost:${used}`;
            log(`✔️ UI (build) served at ${url} (fallback)`);
            resolve(url);
          });
          fallback.on('error', (e2) => error('Express fallback listen error:', e2));
        } else {
          error('Express listen error:', err?.message || err);
        }
      });
    };

    tryListen(PREF_PROD_PORT);
  });
}

// --------------------------- BrowserWindow -----------------------------

/**
 * Creates the BrowserWindow and wires up logs.
 * @param {string} startUrl
 */
async function createWindow(startUrl) {
  await setupPersistence();

  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    show: true,
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    // Minimize-to-tray behavior
    closable: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
      nativeWindowOpen: true,
    },
  });

  // Renderer console -> main logs
  mainWindow.webContents.on('console-message', (_, level, message, line, sourceId) => {
    const tag = ['log', 'warn', 'error'][level] || 'log';
    writeLogLine(`RENDERER-${tag.toUpperCase()}`, [`${message} (${sourceId}:${line})`]);
  });

  mainWindow.webContents.on('did-fail-load', (_e, ec, desc, url, isMain) => {
    error('did-fail-load:', ec, desc, 'url=', url, 'isMain=', isMain);
  });
  mainWindow.webContents.on('did-finish-load', () => log('did-finish-load'));
  mainWindow.webContents.on('did-start-navigation', (_e, url, isInPlace, isMain) => {
    log('did-start-navigation ->', url, 'isMain=', isMain, 'inPlace=', isInPlace);
  });
  mainWindow.webContents.on('did-navigate', (_e, url) => log('did-navigate ->', url));
  mainWindow.webContents.on('did-navigate-in-page', (_e, url) => log('did-navigate-in-page ->', url));

  log('Loading:', startUrl);
  mainWindow.loadURL(startUrl);

  // Permission gate (only allow media)
  session.defaultSession.setPermissionRequestHandler((wc, perm, cb) => {
    log('Permission request:', perm, 'fromURL=', wc?.getURL?.());
    cb(perm === 'media');
  });

  if (!IS_PROD) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.on('close', (e) => {
    e.preventDefault();
    log('Window close intercepted -> minimize to tray');
    mainWindow.minimize();
  });

  try {
    const trayIcon = path.join(__dirname, 'assets', 'icon.ico');
    if (!fs.existsSync(trayIcon)) throw new Error('Tray icon not found at ' + trayIcon);

    tray = new Tray(trayIcon);
    const menu = Menu.buildFromTemplate([
      { label: `${APP_NAME}`, enabled: false },
      { type: 'separator' },
      { label: 'Show', click: () => mainWindow.show() },
      {
        label: 'Quit (Admin only)',
        click: () => { allowQuit = true; app.quit(); },
      },
    ]);
    tray.setToolTip(APP_NAME);
    tray.setContextMenu(menu);
  } catch (err) {
    warn('[Tray] setup failed:', err?.message || err);
  }

  ipcMain.on('login-success', () => {
    log('IPC login-success -> hiding main window');
    mainWindow.hide();
  });
}

// ------------------------------ Lifecycle ------------------------------

app.whenReady().then(async () => {
  attachFileLogger(); // enable file logging
  log('App ready. isPackaged=', app.isPackaged, 'NODE_ENV=', process.env.NODE_ENV || '(unset)');
  log('Paths:', 'resourcesPath=', process.resourcesPath, 'userData=', app.getPath('userData'));

  // Auto-start on login (non-service)
  if (process.platform === 'win32' && !process.argv.includes('--hidden')) {
    app.setLoginItemSettings({ openAtLogin: true, path: process.execPath, args: ['--hidden'] });
    log('LoginItemSettings set (openAtLogin=true)');
  }

  let startUrl;
  if (IS_PROD) {
    const { staticRoot, indexPath, ok } = resolveStaticRoot();
    if (!ok) {
      // Launch a minimal error page to avoid a blank window
      const html = encodeURIComponent(
        `<h1>UI bundle missing</h1><p>Expected at:<br>${staticRoot}<br>index: ${indexPath}</p>`
      );
      startUrl = `data:text/html;charset=utf-8,${html}`;
      error('Aborting Express startup due to missing index.html');
    } else {
      startUrl = await startExpress(staticRoot, indexPath);
    }
  } else {
    startUrl = `http://localhost:${DEV_PORT}`;
  }

  await createWindow(startUrl);
});

app.on('before-quit', (e) => {
  if (!allowQuit) {
    e.preventDefault();
    warn('Blocked programmatic quit (use tray -> Quit)');
  }
});

app.on('activate', () => {
  if (!mainWindow) void createWindow(IS_PROD ? `http://localhost:${PREF_PROD_PORT}` : `http://localhost:${DEV_PORT}`);
  else mainWindow.show();
});

app.on('window-all-closed', () => {
  // keep alive for tray apps
  log('All windows closed (no-op)');
});
