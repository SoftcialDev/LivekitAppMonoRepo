/**
 * @fileoverview useStreamWebSocketGroups hook
 * @description Handles WebSocket group joining for stream emails
 */

import { useEffect } from 'react';
import { webSocketService } from '@/shared/services/webSocket';
import { WebSocketGroupRetryManager } from '@/shared/services/webSocket/managers';
import { logWarn } from '@/shared/utils/logger';
import type { IUseStreamWebSocketGroupsOptions } from './types/useStreamWebSocketGroupsTypes';

/**
 * Handles WebSocket group joining for stream emails
 * @param options - Configuration options for WebSocket groups
 */
export function useStreamWebSocketGroups(options: IUseStreamWebSocketGroupsOptions): void {
  const {
    viewerEmail,
    emailsRef,
    joinedGroupsRef,
    emails,
  } = options;

  useEffect(() => {
    const joinMissingGroups = async (): Promise<void> => {
      try {
        await webSocketService.connect(viewerEmail);
        const groupRetryManager = new WebSocketGroupRetryManager();
        for (const email of emailsRef.current) {
          if (!joinedGroupsRef.current.has(email)) {
            try {
              await groupRetryManager.joinGroupWithRetry(
                email,
                () => webSocketService.joinGroup(email),
                () => webSocketService.isConnected()
              );
              joinedGroupsRef.current.add(email);
            } catch (error) {
              logWarn('Failed to join PSO group after retries', { email, error });
            }
          }
        }
      } catch (error) {
        logWarn('Failed to connect WebSocket', { error });
      }
    };
    joinMissingGroups().catch((err: unknown) => {
      logWarn('[useStreamWebSocketGroups] Error in joinMissingGroups', { error: err });
    });
  }, [viewerEmail, emails.join(','), emailsRef, joinedGroupsRef]);
}

