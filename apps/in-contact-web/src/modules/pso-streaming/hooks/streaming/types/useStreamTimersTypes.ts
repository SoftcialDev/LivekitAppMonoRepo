/**
 * @fileoverview useStreamTimers hook types
 * @description Type definitions for useStreamTimers hook
 */

import type React from 'react';

/**
 * Return type of the useStreamTimers hook
 */
export interface IUseStreamTimersReturn {
  pendingTimersRef: React.MutableRefObject<Record<string, ReturnType<typeof setTimeout>>>;
  stopStatusTimersRef: React.MutableRefObject<Record<string, ReturnType<typeof setTimeout>>>;
  retryTimersRef: React.MutableRefObject<Record<string, ReturnType<typeof setTimeout>>>;
  startConnectionTimersRef: React.MutableRefObject<Record<string, ReturnType<typeof setTimeout>>>;
  clearPendingTimer: (email: string) => void;
  clearStopStatusTimer: (email: string) => void;
  clearRetryTimer: (email: string) => void;
  clearStartConnectionTimer: (email: string) => void;
  clearAllTimers: () => void;
}

