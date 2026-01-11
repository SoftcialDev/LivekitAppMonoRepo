/**
 * @fileoverview useContactManagerStatus hook
 * @summary Hook for managing Contact Manager status with real-time updates
 * @description Subscribes to real-time Contact Manager status updates using WebSocket
 * and keeps a local list in sync with minimal API calls
 */

import { useEffect, useState, useRef } from 'react';
import { webSocketService } from '@/shared/services/webSocket';
import { WEBSOCKET_GROUPS } from '@/shared/services/webSocket/constants/webSocketConstants';
import { getContactManagers } from '@/modules/user-management/api/contactManagerClient';
import { logError, logDebug } from '@/shared/utils/logger';
import type { ContactManagerDto } from '@/modules/user-management/types';
import type { ManagerStatus } from '../enums';
import type {
  ContactManagerStatusUpdate,
  IUseContactManagerStatusReturn,
} from '../types/contactManagerStatusTypes';

/**
 * Type guard that checks whether a raw WebSocket payload matches ContactManagerStatusUpdate
 */
function isStatusUpdate(msg: unknown): msg is ContactManagerStatusUpdate {
  const m = msg as Record<string, unknown>;
  return (
    !!m &&
    typeof m === 'object' &&
    typeof m.managerId === 'string' &&
    typeof m.status === 'string'
  );
}

/**
 * Hook for managing Contact Manager status with real-time WebSocket updates
 * 
 * Behavior:
 * - **Initial load:** fetches the full list once on mount
 * - **Realtime updates:** applies incoming status changes locally to avoid refetching
 * - **Deduplication:** ignores repeated identical events
 * - **Coalesced fallback fetch:** if an event can't be applied (e.g., unknown manager) or after
 *   reconnect, schedules one debounced full refresh to recover missed changes
 * - **Reconnects:** re-joins the `cm-status-updates` group (idempotent) and schedules one
 *   debounced sync
 * - **Singleton safety:** does not call disconnect() on unmount so other views can share the client
 * 
 * @param userEmail - Normalized email for WebSocket authentication
 * @returns Managers list, loading and error flags, and a manual refresh() function
 */
export function useContactManagerStatus(
  userEmail: string
): IUseContactManagerStatusReturn {
  const [managers, setManagers] = useState<ContactManagerDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /** Tracks processed event keys to avoid re-applying duplicates */
  const seenUpdatesRef = useRef<Set<string>>(new Set());
  /** Holds the pending debounce timer id for a coalesced full sync */
  const fetchTimerRef = useRef<number | null>(null);
  /** True while the hook is mounted */
  const mountedRef = useRef(false);

  /**
   * Schedules a single debounced full refresh of the list
   * Subsequent calls during the debounce window are ignored
   * 
   * @param delayMs - Debounce delay in milliseconds. Defaults to 400ms
   */
  const scheduleFullSync = (delayMs = 400) => {
    if (fetchTimerRef.current != null) return;
    fetchTimerRef.current = window.setTimeout(async () => {
      fetchTimerRef.current = null;
      await fetchManagers();
    }, delayMs);
  };

  /**
   * Fetches the full Contact Manager list with loading/error UX handling
   * 
   * - On success, replaces the local managers state
   * - On failure, stores the error
   */
  const fetchManagers = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const result = await getContactManagers();
      setManagers(result.items);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch contact managers';
      const error = err instanceof Error ? err : new Error(errorMessage);
      setError(error);
      logError('Failed to fetch contact managers', { error: err });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Applies a single status update locally to managers when the target
   * exists, avoiding a network request
   * 
   * @param upd - Status-change event
   * @returns true if the update was applied locally; false if the manager was not found
   */
  const applyLocalUpdate = (upd: ContactManagerStatusUpdate): boolean => {
    let applied = false;
    setManagers((prev) => {
      // Support both managerId and id fields present in various API shapes
      const getId = (m: ContactManagerDto) => (m?.id ?? '').toString();
      const idx = prev.findIndex((m) => getId(m) === upd.managerId);
      if (idx === -1) return prev; // unknown manager → caller should schedule a full sync

      const current = prev[idx];
      if (current.status === upd.status) return prev; // no-op

      const next = prev.slice();
      next[idx] = {
        ...current,
        status: upd.status as ManagerStatus,
        updatedAt: upd.updatedAt ?? current.updatedAt,
      };
      applied = true;
      return next;
    });
    return applied;
  };

  useEffect(() => {
    if (!userEmail) return;
    mountedRef.current = true;

    // Initial list load (exactly one API call on mount)
    fetchManagers();

    (async () => {
      try {
        // Connect singleton and (idempotently) join the group
        await webSocketService.connect(userEmail);
        await webSocketService.joinGroup(WEBSOCKET_GROUPS.CM_STATUS_UPDATES);

        // On reconnect: ensure group membership and coalesce a single resync
        const offConn = webSocketService.onConnected(async () => {
          if (!mountedRef.current) return;
          try {
            await webSocketService.joinGroup(WEBSOCKET_GROUPS.CM_STATUS_UPDATES);
          } finally {
            scheduleFullSync(300);
          }
        });

        // On disconnect: log warning; the service keeps retrying in the background
        const offDisc = webSocketService.onDisconnected(() => {
          if (!mountedRef.current) return;
          logDebug('[useContactManagerStatus] WebSocket disconnected');
        });

        // Handle incoming updates; apply locally, dedupe, and only fetch if needed
        const offMsg = webSocketService.onMessage<unknown>((raw) => {
          if (!mountedRef.current) return;

          // Optional: ignore if the backend includes a channel and it isn't ours
          const channel = (raw as any)?.channel as string | undefined;
          if (channel && channel !== WEBSOCKET_GROUPS.CM_STATUS_UPDATES) return;

          if (!isStatusUpdate(raw)) return;

          const key = `${raw.managerId}:${raw.status}:${raw.updatedAt ?? ''}`;
          if (seenUpdatesRef.current.has(key)) return;
          seenUpdatesRef.current.add(key);
          // Prevent unbounded growth of the dedup set
          if (seenUpdatesRef.current.size > 500) {
            seenUpdatesRef.current = new Set(
              Array.from(seenUpdatesRef.current).slice(200)
            );
          }

          // Try to update locally; if the manager isn't present, coalesce a full sync
          const ok = applyLocalUpdate(raw);
          if (!ok) scheduleFullSync(200);
        });

        // Cleanup listeners on unmount
        return () => {
          offMsg?.();
          offConn?.();
          offDisc?.();
        };
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        logError('Failed to setup Contact Manager status subscription', { error: err });
      }
    })();

    return () => {
      mountedRef.current = false;
      if (fetchTimerRef.current != null) {
        clearTimeout(fetchTimerRef.current);
        fetchTimerRef.current = null;
      }
      // Do NOT disconnect the singleton here; other parts of the app may be using it
    };
  }, [userEmail]);

  return {
    managers,
    loading,
    error,
    refresh: fetchManagers,
  };
}

