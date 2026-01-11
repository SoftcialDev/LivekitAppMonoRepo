/**
 * @fileoverview Toast type definitions
 * @summary Type definitions for toast notification system
 * @description Defines types for toast notifications and context
 */

import type { ReactNode } from 'react';

/**
 * The allowed types of a toast notification
 */
export type ToastType = 'success' | 'error' | 'warning';

/**
 * Represents a single toast notification
 */
export interface IToastItem {
  /**
   * Unique identifier for this toast
   */
  id: number;

  /**
   * Text message to display
   */
  message: string;

  /**
   * Visual styling / icon selection
   */
  type: ToastType;
}

/**
 * Shape of the Toast context value
 */
export interface IToastContextType {
  /**
   * Show a toast notification
   * 
   * @param message - The message to display
   * @param type - One of 'success' | 'error' | 'warning'. Defaults to 'success'
   * @param durationMs - How long before auto-dismiss (in milliseconds). Defaults to 2000
   */
  showToast: (message: string, type?: ToastType, durationMs?: number) => void;
}

/**
 * Props for ToastProvider component
 */
export interface IToastProviderProps {
  /**
   * React children to wrap
   */
  children: ReactNode;
}

