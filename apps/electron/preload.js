/**
 * @file Preload script that exposes a safe persistence API to the renderer.
 *
 * @remarks
 * - The object exposed via `contextBridge.exposeInMainWorld` is available in the
 *   renderer "main world", not inside the preload context itself.
 * - Therefore, when the preload needs to call the same methods, it must keep a
 *   local reference to the API object instead of reading `window.<name>`.
 */

const { contextBridge, ipcRenderer } = require('electron');

/** @typedef {{ [key: string]: string }} StorageSnapshot */

/**
 * Local API implementation kept inside preload.
 * We will expose this exact object to the renderer.
 */
const persistedStorageApi = {
  /**
   * Takes a full snapshot of `localStorage` and persists it in the main process.
   */
  save: () => {
    /** @type {StorageSnapshot} */
    const snapshot = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key != null) snapshot[key] = localStorage.getItem(key);
    }
    ipcRenderer.send('storage-save', snapshot);
  },

  /**
   * Loads a previously persisted snapshot from the main process and writes it
   * into `localStorage`.
   */
  load: () => {
    /** @type {StorageSnapshot | unknown} */
    const data = ipcRenderer.sendSync('storage-load');
    if (data && typeof data === 'object') {
      Object.entries(data).forEach(([k, v]) => {
        if (v !== null) localStorage.setItem(k, /** @type {string} */ (v));
      });
    }
  },

  /**
   * Clears both the renderer `localStorage` and the persisted store in main.
   */
  clear: () => {
    localStorage.clear();
    ipcRenderer.send('storage-clear');
  },
};

// Expose to the renderer main world (window.persistedStorage)
contextBridge.exposeInMainWorld('persistedStorage', persistedStorageApi);

// Use the local reference inside preload (NOT window.persistedStorage)
window.addEventListener('DOMContentLoaded', () => persistedStorageApi.load());
window.addEventListener('beforeunload', () => persistedStorageApi.save());
