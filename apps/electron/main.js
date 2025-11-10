/**
 * @fileoverview Electron main process entry point.
 * @description Boots the application window, serves the compiled web app in production, wires persistence IPC, and exposes Windows service helpers.
 */

const { app, BrowserWindow, session, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const fs = require('fs');


/**
 * Buffered logger that writes to the console immediately and to disk once available.
 * @type {string|null}
 */
let logFilePath = null;
const logBuffer = [];

/**
 * Formats a log message and routes it to console and file sinks.
 * @param {'INFO'|'WARN'|'ERROR'|string} level - Log severity.
 * @param {unknown[]} args - Message fragments.
 */
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

/**
 * Hooks the buffered logger to a file once the userData path is available.
 * Flushes any log lines collected before the file existed.
 */
function attachFileLogger() {
  try {
    logFilePath = path.join(app.getPath('userData'), 'main.log');
    // Flush buffer
    for (const line of logBuffer) {
      try { fs.appendFileSync(logFilePath, line + '\n'); } catch {}
    }
    logBuffer.length = 0;
    log('Log file path:', logFilePath);
  } catch (e) {
    warn('Could not attach file logger:', e?.message || e);
  }
}

const APP_NAME = 'InContact';
const SERVICE_NAME = 'InContactService';
const SERVICE_DESC = 'InContact background service';

const DEV_PORT = 5173;
const PREF_PROD_PORT = 3000;

const ADMIN_WEB_DIST_PROD  = path.join(process.resourcesPath, 'admin-web');
const ADMIN_WEB_DIST_LOCAL = path.join(__dirname, '..', 'admin-web', 'dist');

// app.isPackaged is true for bundled builds; NODE_ENV allows overriding during local testing.
const IS_PROD = app.isPackaged || process.env.NODE_ENV === 'production';

let mainWindow = null;
let tray = null;
let allowQuit = false;


if (process.argv.includes('--install-service')) {
  const { Service } = require('node-windows');
  const svc = new Service({
    name: SERVICE_NAME,
    description: SERVICE_DESC,
    script: path.join(__dirname, 'main.js'),
  });
  svc.on('install', () => svc.start());
  svc.install();
  return;
}

if (process.argv.includes('--uninstall-service')) {
  const { Service } = require('node-windows');
  const svc = new Service({ name: SERVICE_NAME });
  svc.on('uninstall', () => log(`${SERVICE_NAME} has been uninstalled.`));
  svc.uninstall();
  return;
}

/** @type {import('electron-store') | undefined} */
let store;

/**
 * Initializes electron-store persistence and IPC handlers.
 * @returns {Promise<void>}
 */
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
      store.clear();
      log('Electron store cleared via IPC');
    }
  });
}


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
    error('index.html not found at:', indexPath);
    error('Expected admin-web dist at:', ADMIN_WEB_DIST_PROD, 'or', ADMIN_WEB_DIST_LOCAL);
  } else {
    log('Serving admin-web from:', candidate);
    log('index.html resolved at:', indexPath);
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

    server.use((req, _res, next) => {
      log('HTTP', req.method, req.url);
      next();
    });
    server.use(express.static(staticRoot));
    server.get('*', (_req, res) => res.sendFile(indexPath));

    const tryListen = (port) => {
      const s = server.listen(port, () => {
        const url = `http://localhost:${port}`;
        log(`UI build served at ${url}`);
        resolve(url);
      });
      s.on('error', (err) => {
        if (err && err.code === 'EADDRINUSE') {
          warn(`Port ${port} in use, retrying on a random port...`);
          const fallback = server.listen(0, () => {
            const used = fallback.address().port;
            const url = `http://localhost:${used}`;
            log(`UI build served at ${url} (fallback)`);
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
