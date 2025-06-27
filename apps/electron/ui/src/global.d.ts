export {};

declare global {
  interface Window {
    /**
     * Inyectado por preload.js: expone el canal
     * de OAuth de Electron para MSAL.
     */
    electronOAuth?: {
      /**
       * Registra un callback que recibe la URL 
       * completa de redirección (myapp://auth?...)
       */
      onCallback: (cb: (rawUrl: string) => void) => void;
    };
  }
}
