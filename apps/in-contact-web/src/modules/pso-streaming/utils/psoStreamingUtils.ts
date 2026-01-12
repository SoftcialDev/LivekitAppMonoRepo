/**
 * @fileoverview PSO Streaming utility functions
 * @summary Utility functions for PSO streaming
 * @description Helper functions for formatting status messages, managing localStorage, and layout preferences
 */

import { StreamingStatus, StreamingStopReason } from '../enums';
import { LAYOUT_OPTIONS, LS_PREFIX, DEFAULT_LAYOUT } from '../constants';
import type { LayoutOption } from '../types';

/**
 * Generates a localStorage key scoped by viewer email
 * @param viewer - Viewer email address
 * @param what - Type of preference ('layout' or 'fixed')
 * @returns Scoped localStorage key
 */
export function lsKey(viewer: string, what: 'layout' | 'fixed'): string {
  return `${LS_PREFIX}:${what}:${viewer || 'anon'}`;
}

/**
 * Loads the saved layout preference from localStorage
 * @param viewer - Viewer email address
 * @param fallback - Default layout value if none is saved
 * @returns Saved layout value or fallback
 */
export function loadLayout(viewer: string, fallback: number = DEFAULT_LAYOUT): LayoutOption {
  if (globalThis.window === undefined) return fallback as LayoutOption;
  const raw = globalThis.localStorage.getItem(lsKey(viewer, 'layout'));
  const n = raw == null ? fallback : Number(raw);
  return (LAYOUT_OPTIONS as readonly number[]).includes(n as any) ? (n as LayoutOption) : (fallback as LayoutOption);
}

/**
 * Loads the list of pinned PSO emails from localStorage
 * @param viewer - Viewer email address
 * @returns Array of pinned PSO email addresses
 */
export function loadFixed(viewer: string): string[] {
  if (globalThis.window === undefined) return [];
  try {
    const raw = globalThis.localStorage.getItem(lsKey(viewer, 'fixed'));
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

/**
 * Converts streaming status and stop reason to a user-friendly message
 * @param status - Streaming status from batch API
 * @param stopReason - Optional specific stop reason
 * @returns Formatted status message for display
 */
export function getStatusMessage(status: StreamingStatus, stopReason?: StreamingStopReason | null): string {
  if (stopReason) {
    switch (stopReason) {
      case StreamingStopReason.QUICK_BREAK:
        return 'Quick Break (5 min)';
      case StreamingStopReason.SHORT_BREAK:
        return 'Short Break (15 min)';
      case StreamingStopReason.LUNCH_BREAK:
        return 'Lunch Break (30 min)';
      case StreamingStopReason.EMERGENCY:
        return 'Emergency';
      case StreamingStopReason.END_OF_SHIFT:
        return 'End of Shift';
      case StreamingStopReason.COMMAND:
        return 'On Break';
      case StreamingStopReason.DISCONNECT:
        return 'Disconnected';
      default:
        break;
    }
  }
  
  switch (status) {
    case StreamingStatus.ON_BREAK:
      return 'On Break';
    case StreamingStatus.DISCONNECTED:
      return 'Disconnected';
    case StreamingStatus.OFFLINE:
      return 'Offline';
    default:
      return '';
  }
}

