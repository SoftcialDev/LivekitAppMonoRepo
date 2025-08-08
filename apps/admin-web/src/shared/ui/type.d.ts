
/**
 * The allowed types of a toast notification.
 */
export type ToastType = 'success' | 'error' | 'warning'

/**
 * Represents a single toast notification.
 */
export interface ToastItem {
  /** Unique identifier for this toast */
  id: number
  /** Text message to display */
  message: string
  /** Visual styling / icon selection */
  type: ToastType
}

/**
 * Shape of the Toast context value.
 */
export interface ToastContextType {
  /**
   * Show a toast notification.
   * @param message - The message to display
   * @param type - One of 'success' | 'error' | 'warning'. Defaults to 'success'
   * @param durationMs - How long before auto‐dismiss (in milliseconds). Defaults to 3000
   */
  showToast: (message: string, type?: ToastType, durationMs?: number) => void
}
