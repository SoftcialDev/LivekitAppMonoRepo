const { app, BrowserWindow, session, Tray, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

/**
 * Loads environment variables from .env located either next to the app
 * during development (__dirname) or in resourcesPath when packaged.
 */
function loadEnv() {
  const candidates = [
    path.join(__dirname, '.env'),
    path.join(process.resourcesPath, '.env'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      dotenv.config({ path: p });
      return;
    }
  }
}

loadEnv();

let logFilePath = null;
const logBuffer = [];

/**
 * Writes a log line to console and file (once available).
 * @param {'INFO'|'WARN'|'ERROR'|string} level
 * @param {unknown[]} args
 */
function writeLogLine(level, args) {
  const ts = new Date().toISOString();
  const msg = `[${ts}] [${level}] ${args.map(String).join(' ')}`;
  if (level === 'ERROR') console.error(msg);
  else console.log(msg);
  if (logFilePath) {
    try { fs.appendFileSync(logFilePath, msg + '\n'); } catch {}
  } else {
    logBuffer.push(msg);
  }
}
const log = (...a) => writeLogLine('INFO', a);
const warn = (...a) => writeLogLine('WARN', a);
const error = (...a) => writeLogLine('ERROR', a);

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

const REMOTE_URL = process.env.ELECTRON_REMOTE_URL;

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

async function createWindow(startUrl) {
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
  if (!REMOTE_URL) {
    const html = encodeURIComponent(
      `<h1>Missing ELECTRON_REMOTE_URL</h1><p>Set ELECTRON_REMOTE_URL in apps/electron/.env</p>`
    );
    startUrl = `data:text/html;charset=utf-8,${html}`;
    error('ELECTRON_REMOTE_URL not set; showing inline error page');
  } else {
    startUrl = REMOTE_URL;
    log('Loading remote URL:', startUrl);
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
  if (!mainWindow) void createWindow(REMOTE_URL || 'data:text/html;charset=utf-8,Missing ELECTRON_REMOTE_URL');
  else mainWindow.show();
});

app.on('window-all-closed', () => {
  // keep alive for tray apps
  log('All windows closed (no-op)');
});
