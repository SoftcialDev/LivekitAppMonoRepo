/**
 * @file Preload script that exposes a minimal, safe storage bridge to the renderer.
 * It mirrors the current `localStorage` snapshot to the main process (e.g., to persist
 * with electron-store) and can restore or clear it on demand.
 *
 * @remarks
 * - Uses `contextBridge.exposeInMainWorld` to keep the renderer in a sandbox.
 * - Uses synchronous IPC for `load` (via `ipcRenderer.sendSync`). This blocks the renderer
 *   until the main process responds. Prefer the async variant shown below if you want
 *   non-blocking behavior.
 */

const { contextBridge, ipcRenderer } = require('electron');

/**
 * Shape of the key/value snapshot that is sent to or from the main process.
 * Keys and values are strings (as per Web Storage API).
 * @typedef {{ [key: string]: string }} StorageSnapshot
 */

/**
 * Public API exposed on `window.persistedStorage`.
 * @typedef PersistedStorage
 * @property {() => void} save
 *   Takes a full snapshot of `localStorage` and sends it to the main process
 *   via the `storage-save` channel for persistence (e.g., electron-store).
 *
 * @property {() => void} load
 *   Requests the last persisted snapshot from the main process via the
 *   `storage-load` channel (synchronously) and rehydrates `localStorage`
 *   with the returned data.
 *
 * @property {() => void} clear
 *   Clears `localStorage` and instructs the main process (via `storage-clear`)
 *   to wipe the persisted store as well.
 */

contextBridge.exposeInMainWorld('persistedStorage', {
  /**
   * Capture the current `localStorage` as a plain object and persist it in
   * the main process (e.g., with electron-store).
   */
  save: () => {
    /** @type {StorageSnapshot} */
    const snapshot = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      // Defensive: `key` can be null in some edge cases
      if (key != null) {
        snapshot[key] = localStorage.getItem(key);
      }
    }
    ipcRenderer.send('storage-save', snapshot);
  },

  /**
   * Load a previously persisted snapshot from the main process and write it
   * into `localStorage`. This call is synchronous and will block until the
   * main process responds.
   *
   * @throws Will not throw by design, but silently no-ops if the main process
   *         returns a non-object value.
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
   * Clear both the renderer `localStorage` and the persisted store in the main process.
   * This is useful for logout flows or resetting app state.
   */
  clear: () => {
    localStorage.clear();
    ipcRenderer.send('storage-clear');
  },
});

/**
 * Automatically restore on DOM ready and save on window unload so that state
 * survives app restarts and page reloads.
 */
window.addEventListener('DOMContentLoaded', () => window.persistedStorage.load());
window.addEventListener('beforeunload', () => window.persistedStorage.save());
