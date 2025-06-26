import { app, BrowserWindow, Tray, Menu, ipcMain } from 'electron';
import * as path from 'path';

let mainWindow: BrowserWindow;
let tray: Tray;

/** Creates the window and loads the built UI */
async function createWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  // Always load the static file
  await mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Hide to tray instead of quitting
  mainWindow.on('close', (e) => {
    e.preventDefault();
    mainWindow.hide();
  });
}

/** Configures the tray icon with "Show" + disabled "Quit" */
function setupTray(): void {
  tray = new Tray(path.join(__dirname, 'assets', 'icon.ico'));
  tray.setToolTip('LiveKit Electron App');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Show App', click: () => mainWindow.show() },
      { label: 'Quit', enabled: false },
    ])
  );
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => mainWindow?.show());
  app.whenReady().then(async () => {
    await createWindow();
    setupTray();
    mainWindow.once('ready-to-show', () => mainWindow.show());
  });
  // Prevent Windows from quitting when window is closed
  app.on('window-all-closed', (e: { preventDefault: () => any; }) => e.preventDefault());
  // macOS: recreate window on dock click
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}

// Relay login event
ipcMain.handle('auth:login', () => {
  mainWindow.webContents.send('auth:login');
});
