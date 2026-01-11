/**
 * @fileoverview Talk session utilities
 * @summary Utilities specific to talk session operations
 * @description Helper functions for formatting duration, calculating duration, and formatting stop reasons
 */

import { TalkStopReason } from '../enums/talkStopReason';

/**
 * Provides a human-readable label for each TalkStopReason
 * 
 * @param reason - The TalkStopReason enum value or string
 * @returns A string label for the reason, or '—' if reason is null/empty
 */
export function getStopReasonLabel(reason: string | null): string {
  if (!reason) return '—';
  
  switch (reason) {
    case TalkStopReason.USER_STOP:
      return 'User Stop';
    case TalkStopReason.PSO_DISCONNECTED:
      return 'PSO Disconnected';
    case TalkStopReason.SUPERVISOR_DISCONNECTED:
      return 'Supervisor Disconnected';
    case TalkStopReason.BROWSER_REFRESH:
      return 'Browser Refresh';
    case TalkStopReason.CONNECTION_ERROR:
      return 'Connection Error';
    case TalkStopReason.UNKNOWN:
      return 'Unknown';
    default:
      return reason;
  }
}

/**
 * Calculates the duration of a talk session in seconds
 * 
 * @param startedAt - ISO timestamp when session started
 * @param stoppedAt - ISO timestamp when session stopped, or null if still active
 * @returns Duration in seconds, or null if session is still active
 */
export function calculateDuration(startedAt: string, stoppedAt: string | null): number | null {
  if (!stoppedAt) return null;
  const start = new Date(startedAt).getTime();
  const stop = new Date(stoppedAt).getTime();
  return Math.floor((stop - start) / 1000);
}

/**
 * Formats duration in seconds to a human-readable string
 * 
 * Formats as:
 * - "Active" if seconds is null (session still active)
 * - "Xs" if less than 60 seconds
 * - "Xm Ys" if less than 60 minutes
 * - "Xh Ym" if 60+ minutes
 * 
 * @param seconds - Duration in seconds, or null if still active
 * @returns Formatted duration string (e.g., "5m 30s", "1h 5m", "Active")
 */
export function formatDuration(seconds: number | null): string {
  if (seconds === null) return 'Active';
  if (seconds < 60) return `${seconds}s`;
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

