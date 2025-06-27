// main.js
const { app, BrowserWindow, session, ipcMain } = require('electron');
const path = require('path');
const fs   = require('fs');

const PORT        = 3000;
const DIST_FOLDER = path.join(__dirname, 'ui', 'dist');
const HAS_DIST    = fs.existsSync(DIST_FOLDER);
const IS_PROD     = process.env.NODE_ENV === 'production' || HAS_DIST;
const START_URL   = `http://localhost:${PORT}`;

// dynamically import electron-store so ESM works
let store;
async function setupPersistence() {
  const { default: Store } = await import('electron-store');
  store = new Store();
  // save incoming snapshots
  ipcMain.on('storage-save', (_evt, data) => {
    store.set('localStorage', data);
  });
  // reply with last snapshot
  ipcMain.on('storage-load', (evt) => {
    evt.returnValue = store.get('localStorage') || {};
  });
}

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

async function createWindow() {
  await setupPersistence();

  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration:  false,
      webSecurity:     true,
      preload:         path.join(__dirname, 'preload.js'),
      nativeWindowOpen: true,
    },
  });

  win.loadURL(START_URL);

  session.defaultSession.setPermissionRequestHandler((_, perm, cb) =>
    cb(perm === 'media')
  );

  if (!IS_PROD) {
    win.webContents.openDevTools({ mode: 'detach' });
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
