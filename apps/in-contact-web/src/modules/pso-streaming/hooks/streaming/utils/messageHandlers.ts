/**
 * @fileoverview Message handlers for WebSocket stream status updates
 * @description Extracted handler functions to reduce nesting in useStreamWebSocketMessages
 */

import { logDebug, logError } from '@/shared/utils/logger';
import { PENDING_TIMEOUT_MS, START_CONNECTION_TIMEOUT_MS } from '../../../constants';
import type { CredsMap } from '../../../types';
import type { IUseStreamWebSocketMessagesOptions } from '../types/useStreamWebSocketMessagesTypes';

/**
 * Handles pending status message
 * @param emailKey - Email key for the pending stream
 * @param options - Handler options
 */
function handlePendingMessage(
  emailKey: string,
  options: IUseStreamWebSocketMessagesOptions
): void {
  const {
    clearPendingTimer,
    clearRetryTimer,
    clearStartConnectionTimer,
    setCredsMap,
    createAttemptFetchWithRetry,
    pendingTimersRef,
    startConnectionTimersRef,
    handlePendingTimeout,
    handleStartConnectionTimeout,
  } = options;

  clearPendingTimer(emailKey);
  clearRetryTimer(emailKey);
  clearStartConnectionTimer(emailKey);

  logDebug('[useStreamWebSocketMessages] Received pending status, starting optimistic connection', {
    email: emailKey,
  });

  setCredsMap((prev: CredsMap) => {
    const existing = prev[emailKey];
    return {
      ...prev,
      [emailKey]: existing ? { ...existing, loading: true } : { loading: true }
    };
  });

  const attemptFetchWithRetry = createAttemptFetchWithRetry(emailKey);
  attemptFetchWithRetry().catch((err: unknown) => {
    logError('[useStreamWebSocketMessages] Error in attemptFetchWithRetry', { error: err, email: emailKey });
  });

  pendingTimersRef.current[emailKey] = setTimeout(() => {
    handlePendingTimeout(emailKey);
  }, PENDING_TIMEOUT_MS);

  startConnectionTimersRef.current[emailKey] = setTimeout(() => {
    delete startConnectionTimersRef.current[emailKey];
    handleStartConnectionTimeout(emailKey);
  }, START_CONNECTION_TIMEOUT_MS);
}

/**
 * Handles failed status message
 * @param emailKey - Email key for the failed stream
 * @param options - Handler options
 */
function handleFailedMessage(
  emailKey: string,
  options: IUseStreamWebSocketMessagesOptions
): void {
  const {
    clearPendingTimer,
    clearStartConnectionTimer,
    setCredsMap,
  } = options;

  clearPendingTimer(emailKey);
  clearStartConnectionTimer(emailKey);
  setCredsMap((prev: CredsMap) => {
    const current = prev[emailKey] ?? {};
    return {
      ...prev,
      [emailKey]: { ...current, loading: false }
    };
  });
}

/**
 * Updates creds map to set loading state
 * @param emailKey - Email key
 * @param setCredsMap - Creds map setter
 * @param loading - Loading state
 */
function updateCredsMapLoading(
  emailKey: string,
  setCredsMap: IUseStreamWebSocketMessagesOptions['setCredsMap'],
  loading: boolean
): void {
  setCredsMap((prev: CredsMap) => {
    const current = prev[emailKey];
    if (!current) {
      return {
        ...prev,
        [emailKey]: { loading }
      };
    }
    if (current.loading === loading) {
      return prev;
    }
    return {
      ...prev,
      [emailKey]: { ...current, loading }
    };
  });
}

/**
 * Handles started status message when token fetch is already in progress
 * @param emailKey - Email key for the started stream
 * @param setCredsMap - Creds map setter
 */
function handleStartedWithFetchInProgress(
  emailKey: string,
  setCredsMap: IUseStreamWebSocketMessagesOptions['setCredsMap']
): void {
  logDebug('[useStreamWebSocketMessages] Token fetch already in progress for started status, ensuring loading state is correct', {
    email: emailKey,
  });

  setCredsMap((prev: CredsMap) => {
    const current = prev[emailKey];
    if (!current) {
      return {
        ...prev,
        [emailKey]: { loading: true }
      };
    }
    if (current.loading || current.accessToken) {
      return prev;
    }
    return {
      ...prev,
      [emailKey]: { ...current, loading: true }
    };
  });
}

/**
 * Handles started status message when token already exists
 * @param emailKey - Email key for the started stream
 * @param setCredsMap - Creds map setter
 */
function handleStartedWithToken(
  emailKey: string,
  setCredsMap: IUseStreamWebSocketMessagesOptions['setCredsMap']
): void {
  logDebug('[useStreamWebSocketMessages] Token already available, updating loading state', {
    email: emailKey,
  });

  setCredsMap((prev: CredsMap) => {
    const current = prev[emailKey];
    if (!current || current.loading === false) {
      return prev;
    }
    return {
      ...prev,
      [emailKey]: { ...current, loading: false }
    };
  });
}

/**
 * Handles started status message
 * @param emailKey - Email key for the started stream
 * @param options - Handler options
 */
function handleStartedMessage(
  emailKey: string,
  options: IUseStreamWebSocketMessagesOptions
): void {
  const {
    clearPendingTimer,
    clearRetryTimer,
    clearStartConnectionTimer,
    clearStopStatusTimer,
    canceledUsersRef,
    fetchingTokensRef,
    credsMapRef,
    setCredsMap,
    refreshTokenForEmail,
    handleRefreshTokenError,
  } = options;

  clearPendingTimer(emailKey);
  clearRetryTimer(emailKey);
  clearStartConnectionTimer(emailKey);

  if (canceledUsersRef.current.has(emailKey)) {
    const ns = new Set(canceledUsersRef.current);
    ns.delete(emailKey);
    canceledUsersRef.current = ns;
  }

  clearStopStatusTimer(emailKey);

  if (fetchingTokensRef.current.has(emailKey)) {
    handleStartedWithFetchInProgress(emailKey, setCredsMap);
    return;
  }

  const currentCreds = credsMapRef.current[emailKey];
  if (currentCreds?.accessToken) {
    handleStartedWithToken(emailKey, setCredsMap);
  } else {
    updateCredsMapLoading(emailKey, setCredsMap, true);

    refreshTokenForEmail(emailKey).catch((error: unknown) => {
      logError('[useStreamWebSocketMessages] Failed to fetch token after started status', { error, email: emailKey });
      handleRefreshTokenError(emailKey);
    });
  }
}

/**
 * Handles stopped status message
 * @param emailKey - Email key for the stopped stream
 * @param options - Handler options
 */
function handleStoppedMessage(
  emailKey: string,
  options: IUseStreamWebSocketMessagesOptions
): void {
  const {
    clearPendingTimer,
    clearStopStatusTimer,
    clearStartConnectionTimer,
    canceledUsersRef,
    clearOne,
    stopStatusTimersRef,
    handleStopStatusTimeout,
  } = options;

  clearPendingTimer(emailKey);
  clearStopStatusTimer(emailKey);
  clearStartConnectionTimer(emailKey);

  const ns = new Set(canceledUsersRef.current);
  ns.add(emailKey);
  canceledUsersRef.current = ns;
  clearOne(emailKey);

  if (!stopStatusTimersRef.current[emailKey]) {
    stopStatusTimersRef.current[emailKey] = setTimeout(() => {
      handleStopStatusTimeout(emailKey).catch((err: unknown) => {
        logError('[useStreamWebSocketMessages] Error in handleStopStatusTimeout', { error: err, email: emailKey });
      });
    }, 1000);
  }
}

export {
  handlePendingMessage,
  handleFailedMessage,
  handleStartedMessage,
  handleStoppedMessage,
};

