/**
 * @fileoverview useStreamCommandHandling - Handles streaming commands from WebSocket
 * @description Listens for START, STOP, and REFRESH commands from WebSocket and automatically
 * triggers the corresponding stream actions. Manages WebSocket group membership for command delivery.
 */

import { useEffect, useRef } from 'react';
import { webSocketService } from '@/shared/services/webSocket';
import { WebSocketGroupRetryManager } from '@/shared/services/webSocket/managers';
import { logDebug, logError, logWarn } from '@/shared/utils/logger';
import type { IUseStreamCommandHandlingOptions } from './types/useStreamCommandHandlingTypes';

/**
 * Handles streaming commands received via WebSocket
 * @param options - Configuration options
 * @param options.userEmail - Email of the user to receive commands for
 * @param options.onStartCommand - Callback function to execute when START command is received
 * @param options.onStopCommand - Callback function to execute when STOP command is received
 */
export function useStreamCommandHandling({
  userEmail,
  onStartCommand,
  onStopCommand,
}: IUseStreamCommandHandlingOptions): void {
  const handlerRef = useRef<((message: unknown) => void) | null>(null);
  const processingRef = useRef<boolean>(false);
  const onStartCommandRef = useRef(onStartCommand);
  const onStopCommandRef = useRef(onStopCommand);

  useEffect(() => {
    onStartCommandRef.current = onStartCommand;
    onStopCommandRef.current = onStopCommand;
  }, [onStartCommand, onStopCommand]);

  useEffect(() => {
    if (!userEmail) {
      return;
    }

    let unsubscribeMessage: (() => void) | null = null;
    let unsubscribeConnected: (() => void) | null = null;

    const commandsGroup = `commands:${userEmail.toLowerCase()}`;

    const handleMessage = (message: unknown): void => {
      try {
        const msg = message as Record<string, unknown>;
        
        if (!('command' in msg)) {
          return;
        }

        const command = String(msg.command).trim().toUpperCase();
        const employeeEmailValue = msg.employeeEmail;
        const reasonValue = msg.reason;
        const messageEmail = typeof employeeEmailValue === 'string' ? employeeEmailValue.toLowerCase() : null;
        const reason = typeof reasonValue === 'string' ? reasonValue : undefined;

        if (messageEmail && messageEmail !== userEmail.toLowerCase()) {
          return;
        }

        if (processingRef.current) {
          logDebug('[useStreamCommandHandling] Command already processing, skipping', { command });
          return;
        }

        if (command === 'START') {
          logDebug('[useStreamCommandHandling] Received START command', { userEmail });
          
          const initiatedByEmail = typeof msg.initiatedByEmail === 'string' ? msg.initiatedByEmail : null;
          if (initiatedByEmail) {
            try {
              localStorage.setItem('lastCommandInitiatorEmail', initiatedByEmail);
              logDebug('[useStreamCommandHandling] Stored command initiator email', { initiatedByEmail });
            } catch (storageError) {
              logError('[useStreamCommandHandling] Failed to store initiator email', { error: storageError });
            }
          }
          
          try {
            localStorage.setItem('lastStartCommandTimestamp', Date.now().toString());
            logDebug('[useStreamCommandHandling] Stored START command timestamp');
          } catch (storageError) {
            logError('[useStreamCommandHandling] Failed to store START timestamp', { error: storageError });
          }
          
          processingRef.current = true;
          onStartCommandRef.current()
            .then(() => {
              logDebug('[useStreamCommandHandling] START command processed successfully');
            })
            .catch((error) => {
              logError('[useStreamCommandHandling] Failed to process START command', { error, userEmail });
            })
            .finally(() => {
              processingRef.current = false;
            });
        } else if (command === 'STOP') {
          logDebug('[useStreamCommandHandling] Received STOP command', { userEmail, reason });
          processingRef.current = true;
          onStopCommandRef.current(reason)
            .then(() => {
              logDebug('[useStreamCommandHandling] STOP command processed successfully', { reason });
            })
            .catch((error) => {
              logError('[useStreamCommandHandling] Failed to process STOP command', { error, userEmail, reason });
            })
            .finally(() => {
              processingRef.current = false;
            });
        } else if (command === 'REFRESH') {
          logDebug('[useStreamCommandHandling] Received REFRESH command, reloading page', { userEmail });
          globalThis.location.reload();
        }
      } catch (error) {
        logError('[useStreamCommandHandling] Error handling message', { error, userEmail });
      }
    };

    handlerRef.current = handleMessage;

    const groupRetryManager = new WebSocketGroupRetryManager();

    const initialize = async (): Promise<void> => {
      try {
        await webSocketService.connect(userEmail);
        await webSocketService.joinGroup(commandsGroup);
        logDebug('[useStreamCommandHandling] Joined commands group', { group: commandsGroup });
      } catch (error) {
        logError('[useStreamCommandHandling] Failed to join commands group', { error, group: commandsGroup });
      }

      unsubscribeMessage = webSocketService.onMessage(handleMessage);
    };

    initialize();

    unsubscribeConnected = webSocketService.onConnected(async () => {
      try {
        await groupRetryManager.joinGroupWithRetry(
          commandsGroup,
          () => webSocketService.joinGroup(commandsGroup),
          () => webSocketService.isConnected()
        );
        logDebug('[useStreamCommandHandling] Rejoined commands group on reconnect', { group: commandsGroup });
      } catch (error) {
        logError('[useStreamCommandHandling] Failed to rejoin commands group on reconnect after retries', { error, group: commandsGroup });
      }
    });

    return () => {
      if (unsubscribeMessage) {
        unsubscribeMessage();
      }
      if (unsubscribeConnected) {
        unsubscribeConnected();
      }
      webSocketService.leaveGroup(commandsGroup).catch(() => {
      });
    };
  }, [userEmail]);
}

