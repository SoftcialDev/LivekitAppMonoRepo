/**
 * @fileoverview Platform detection utilities
 * @summary Detects if app is running in Electron or browser
 */

/**
 * Checks if the app is running in Electron
 * 
 * Electron automatically adds "Electron" to the userAgent string,
 * so we can detect it without any special configuration.
 */
export function isElectron(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return navigator.userAgent.toLowerCase().includes('electron');
}

/**
 * Checks if the app is running in a regular browser
 */
export function isBrowser(): boolean {
  return !isElectron();
}

