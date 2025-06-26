import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

declare global {
  interface Window {
    electronAPI: {
      /**
       * Requests the main process to start the authentication flow.
       * @returns A promise that resolves when the request is sent.
       */
      login: () => Promise<void>;

      /**
       * Registers a callback to be invoked when the main process
       * emits an 'auth:login' event (e.g. to trigger MSAL in the renderer).
       * @param callback - Function to call on login event.
       */
      onAuthLogin: (callback: () => void) => void;
    };
  }
}

contextBridge.exposeInMainWorld('electronAPI', {
  login: (): Promise<void> => {
    // Invoke the IPC handler in main.ts
    return ipcRenderer.invoke('auth:login');
  },

  onAuthLogin: (callback: () => void): void => {
    // Listen for the 'auth:login' message from main.ts
    ipcRenderer.on('auth:login', (_event: IpcRendererEvent) => {
      callback();
    });
  },
});
