/**
 * @fileoverview useStreamWebSocketMessages hook
 * @description Handles WebSocket messages for stream status updates (pending, started, failed, stopped)
 */

import { useEffect } from 'react';
import { webSocketService } from '@/shared/services/webSocket';
import { logDebug } from '@/shared/utils/logger';
import { parseWebSocketMessage } from './utils';
import {
  handlePendingMessage,
  handleFailedMessage,
  handleStartedMessage,
  handleStoppedMessage,
} from './utils/messageHandlers';
import type { IUseStreamWebSocketMessagesOptions } from './types/useStreamWebSocketMessagesTypes';

/**
 * Handles WebSocket messages for stream status updates
 * @param options - Configuration options for WebSocket message handling
 */
export function useStreamWebSocketMessages(options: IUseStreamWebSocketMessagesOptions): void {
  const {
    emailsRef,
    wsHandlerRegisteredRef,
  } = options;

  useEffect(() => {
    if (wsHandlerRegisteredRef.current) {
      return;
    }

    const handleMessage = (msg: unknown): void => {
      logDebug('WebSocket message received', { msg });
      
      const parsed = parseWebSocketMessage(msg);
      const currentEmails = emailsRef.current;
      
      if (!parsed.targetEmail || !currentEmails.includes(parsed.targetEmail)) {
        return;
      }

      if (parsed.pending) {
        handlePendingMessage(parsed.targetEmail, options);
        return;
      }

      if (parsed.failed) {
        handleFailedMessage(parsed.targetEmail, options);
        return;
      }

      if (parsed.started === true) {
        handleStartedMessage(parsed.targetEmail, options);
        return;
      }

      if (parsed.started === false) {
        handleStoppedMessage(parsed.targetEmail, options);
      }
    };

    const unsubscribe = webSocketService.onMessage(handleMessage);
    wsHandlerRegisteredRef.current = true;
    
    return () => {
      unsubscribe();
      wsHandlerRegisteredRef.current = false;
    };
  }, [emailsRef, wsHandlerRegisteredRef, options]);
}

