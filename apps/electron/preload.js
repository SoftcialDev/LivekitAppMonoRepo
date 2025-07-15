// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('persistedStorage', {
  save: () => {
    const snapshot = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      snapshot[key] = localStorage.getItem(key);
    }
    ipcRenderer.send('storage-save', snapshot);
  },
  load: () => {
    const data = ipcRenderer.sendSync('storage-load');
    if (data && typeof data === 'object') {
      Object.entries(data).forEach(([k, v]) => {
        if (v !== null) localStorage.setItem(k, v);
      });
    }
  },
  clear: () => {
    // Limpia localStorage
    localStorage.clear();
    // Pide al main process que borre el store de electron-store
    ipcRenderer.send('storage-clear');
  },
});

// restore on load, save on exit
window.addEventListener('DOMContentLoaded', () => window.persistedStorage.load());
window.addEventListener('beforeunload', () => window.persistedStorage.save());
