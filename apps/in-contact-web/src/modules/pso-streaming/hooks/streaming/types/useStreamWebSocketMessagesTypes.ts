/**
 * @fileoverview useStreamWebSocketMessages hook types
 * @description Type definitions for useStreamWebSocketMessages hook
 */

import type { CredsMap } from '../../../types';

/**
 * Options for useStreamWebSocketMessages hook
 */
export interface IUseStreamWebSocketMessagesOptions {
  emailsRef: React.MutableRefObject<string[]>;
  credsMapRef: React.MutableRefObject<CredsMap>;
  setCredsMap: React.Dispatch<React.SetStateAction<CredsMap>>;
  pendingTimersRef: React.MutableRefObject<Record<string, ReturnType<typeof setTimeout>>>;
  stopStatusTimersRef: React.MutableRefObject<Record<string, ReturnType<typeof setTimeout>>>;
  startConnectionTimersRef: React.MutableRefObject<Record<string, ReturnType<typeof setTimeout>>>;
  fetchingTokensRef: React.MutableRefObject<Set<string>>;
  canceledUsersRef: React.MutableRefObject<Set<string>>;
  clearPendingTimer: (email: string) => void;
  clearRetryTimer: (email: string) => void;
  clearStartConnectionTimer: (email: string) => void;
  clearStopStatusTimer: (email: string) => void;
  clearOne: (email: string) => void;
  createAttemptFetchWithRetry: (emailKey: string) => (attempt?: number) => Promise<void>;
  handlePendingTimeout: (emailKey: string) => void;
  handleStartConnectionTimeout: (emailKey: string) => void;
  handleStopStatusTimeout: (emailKey: string) => Promise<void>;
  refreshTokenForEmail: (email: string) => Promise<void>;
  handleRefreshTokenError: (emailKey: string) => void;
  wsHandlerRegisteredRef: React.MutableRefObject<boolean>;
}

