const { app, BrowserWindow, Tray, ipcMain, screen, nativeImage } = require('electron');
const path  = require('path');
const fs    = require('fs');

let mainWindow;
let tray;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  mainWindow = new BrowserWindow({
    width,
    height,
    webPreferences: {
      preload: path.join(app.getAppPath(), 'preload.js'),
      contextIsolation: true,
      sandbox: false,
      nodeIntegration: false
    }
  });
  mainWindow.loadURL('https://mediaservices.softcial.com/camera');
}

function createTray() {
  const iconPath = fs.existsSync(path.join(__dirname, 'assets', 'icon.png'))
    ? path.join(__dirname, 'assets', 'icon.png')
    : path.join(__dirname, 'assets', 'default-icon.png');

  tray = new Tray(nativeImage.createFromPath(iconPath));
  tray.setToolTip('Waiting for stats…');
}

ipcMain.on('stats', (_, { resText, up, down }) => {
  tray?.setToolTip(`Res: ${resText} | ↑ ${up} kb/s ↓ ${down} kb/s`);
});

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('window-all-closed', () => app.quit());

app.on('activate', () => {
  if (!mainWindow || mainWindow.isDestroyed()) createWindow();
  else mainWindow.show();
});
