/**
 * @fileoverview useStreamCommandHandling - Handles START/STOP commands from WebSocket
 * @summary Listens to WebSocket commands and triggers stream start/stop
 * @description Listens for START/STOP commands from WebSocket and automatically
 * starts or stops the stream accordingly
 */

import { useEffect, useRef } from 'react';
import { webSocketService } from '@/shared/services/webSocket';
import { logDebug, logError } from '@/shared/utils/logger';
import type { IUseStreamCommandHandlingOptions } from './types/useStreamCommandHandlingTypes';

/**
 * Hook for handling START/STOP streaming commands from WebSocket
 * 
 * Listens for WebSocket messages with format:
 * - { command: 'START' | 'STOP' | 'REFRESH', employeeEmail?: string, reason?: string }
 * 
 * Automatically starts/stops streaming when commands are received
 * 
 * @param options - Configuration options
 */
export function useStreamCommandHandling({
  userEmail,
  onStartCommand,
  onStopCommand,
}: IUseStreamCommandHandlingOptions): void {
  const handlerRef = useRef<((message: unknown) => void) | null>(null);
  const processingRef = useRef<boolean>(false);

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
        
        // Check if message has command field
        if (!('command' in msg)) {
          return;
        }

        const command = String(msg.command).trim().toUpperCase();
        const messageEmail = msg.employeeEmail ? String(msg.employeeEmail).toLowerCase() : null;
        const reason = msg.reason ? String(msg.reason) : undefined;

        // Filter by email if provided in message
        if (messageEmail && messageEmail !== userEmail.toLowerCase()) {
          return;
        }

        // Prevent concurrent command processing
        if (processingRef.current) {
          logDebug('[useStreamCommandHandling] Command already processing, skipping', { command });
          return;
        }

        if (command === 'START') {
          logDebug('[useStreamCommandHandling] Received START command', { userEmail });
          processingRef.current = true;
          onStartCommand()
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
          onStopCommand(reason)
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
          window.location.reload();
        }
      } catch (error) {
        logError('[useStreamCommandHandling] Error handling message', { error, userEmail });
      }
    };

    handlerRef.current = handleMessage;

    // Join commands group and subscribe to messages
    const initialize = async (): Promise<void> => {
      try {
        // Join commands group (similar to admin-web useBootstrap)
        await webSocketService.joinGroup(commandsGroup);
        logDebug('[useStreamCommandHandling] Joined commands group', { group: commandsGroup });
      } catch (error) {
        logError('[useStreamCommandHandling] Failed to join commands group', { error, group: commandsGroup });
      }

      // Subscribe to WebSocket messages
      unsubscribeMessage = webSocketService.onMessage(handleMessage);
    };

    // Initialize on mount and when WebSocket reconnects
    initialize();

    // Rejoin group on reconnect
    unsubscribeConnected = webSocketService.onConnected(async () => {
      try {
        await webSocketService.joinGroup(commandsGroup);
        logDebug('[useStreamCommandHandling] Rejoined commands group on reconnect', { group: commandsGroup });
      } catch (error) {
        logError('[useStreamCommandHandling] Failed to rejoin commands group on reconnect', { error, group: commandsGroup });
      }
    });

    return () => {
      if (unsubscribeMessage) {
        unsubscribeMessage();
      }
      if (unsubscribeConnected) {
        unsubscribeConnected();
      }
      // Leave group on cleanup (optional, as service manages groups)
      webSocketService.leaveGroup(commandsGroup).catch(() => {
        // Ignore errors on cleanup
      });
    };
  }, [userEmail, onStartCommand, onStopCommand]);
}

