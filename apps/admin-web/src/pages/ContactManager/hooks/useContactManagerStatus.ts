import { useEffect, useState, useRef } from 'react';

import {
  getContactManagers,
  ContactManagerProfile as _CMP,
} from '@/shared/api/contactManagerClient';
import { useToast } from '@/shared/ui/ToastContext';
import { webPubSubClient as pubSub } from '@/shared/api/webpubsubClient';

export type ContactManagerProfile = _CMP;

export type ManagerStatus = 'Unavailable' | 'Available' | 'OnBreak' | 'OnAnotherTask';

/**
 * Shape of a Contact Manager status-update event delivered via PubSub.
 */
export interface ContactManagerStatusUpdate {
  /** Unique identifier of the Contact Manager being updated. */
  managerId: string;
  /** New status value for the Contact Manager. */
  status: ManagerStatus;
  /** Optional ISO timestamp indicating when this status was set. */
  updatedAt?: string;
  /** Optional channel/group indicator if your backend includes it. */
  channel?: string;
}

/**
 * Type guard that checks whether a raw PubSub payload matches
 * {@link ContactManagerStatusUpdate}.
 */
function isStatusUpdate(msg: unknown): msg is ContactManagerStatusUpdate {
  const m = msg as Record<string, unknown>;
  return !!m && typeof m === 'object'
    && typeof m.managerId === 'string'
    && typeof m.status === 'string';
}

/**
 * useContactManagerStatus
 * -----------------------
 * Subscribes to real-time Contact Manager status updates using a **singleton**
 * Web PubSub client and keeps a local list in sync with minimal API calls.
 *
 * Behavior:
 * - **Initial load:** fetches the full list once on mount.
 * - **Realtime updates:** applies incoming status changes **locally** to avoid refetching.
 * - **Deduplication:** ignores repeated identical events.
 * - **Coalesced fallback fetch:** if an event can’t be applied (e.g., unknown manager) or after
 *   reconnect, schedules **one debounced** full refresh to recover missed changes.
 * - **Reconnects:** re-joins the `"cm-status-updates"` group (idempotent) and schedules one
 *   debounced sync; shows user feedback via toasts.
 * - **Singleton safety:** does not call `disconnect()` on unmount so other views can share the client.
 *
 * @param userEmail Normalized email for PubSub authentication.
 * @returns Managers list, loading and error flags, and a manual `refresh()` function.
 */
export function useContactManagerStatus(
  userEmail: string,
): {
  /** Current list of Contact Managers. */
  managers: ContactManagerProfile[];
  /** True while a full list fetch is in progress. */
  loading: boolean;
  /** Error from the last fetch or PubSub setup, if any. */
  error: Error | null;
  /** Manually re-fetches the full list. */
  refresh: () => Promise<void>;
} {
  const [managers, setManagers] = useState<ContactManagerProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const { showToast } = useToast();

  /** Tracks processed event keys to avoid re-applying duplicates. */
  const seenUpdatesRef = useRef<Set<string>>(new Set());
  /** Holds the pending debounce timer id for a coalesced full sync. */
  const fetchTimerRef = useRef<number | null>(null);
  /** True while the hook is mounted. */
  const mountedRef = useRef(false);

  /**
   * Schedules a **single debounced** full refresh of the list.
   * Subsequent calls during the debounce window are ignored.
   *
   * @param delayMs Debounce delay in milliseconds. Defaults to 400ms.
   */
  const scheduleFullSync = (delayMs = 400) => {
    if (fetchTimerRef.current != null) return;
    fetchTimerRef.current = window.setTimeout(async () => {
      fetchTimerRef.current = null;
      await fetchManagers();
    }, delayMs);
  };

  /**
   * Fetches the full Contact Manager list with loading/error UX handling.
   *
   * - On success, replaces the local `managers` state.
   * - On failure, stores the error and shows a toast.
   */
  const fetchManagers = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getContactManagers();
      setManagers(list);
    } catch (err: any) {
 
    } finally {
      setLoading(false);
    }
  };

  /**
   * Applies a single status update **locally** to `managers` when the target
   * exists, avoiding a network request.
   *
   * @param upd Status-change event.
   * @returns `true` if the update was applied locally; `false` if the manager was not found.
   */
  const applyLocalUpdate = (upd: ContactManagerStatusUpdate): boolean => {
    let applied = false;
    setManagers((prev) => {
      // Support both `managerId` and `id` fields present in various API shapes.
      const getId = (m: any) => (m?.managerId ?? m?.id ?? '').toString();
      const idx = prev.findIndex((m) => getId(m) === upd.managerId);
      if (idx === -1) return prev; // unknown manager → caller should schedule a full sync

      const current = prev[idx] as any;
      if (current.status === upd.status) return prev; // no-op

      const next = prev.slice();
      next[idx] = {
        ...current,
        status: upd.status,
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

    // Initial list load (exactly one API call on mount).
    fetchManagers();

    (async () => {
      try {
        // Connect singleton and (idempotently) join the group.
        await pubSub.connect(userEmail);
        await pubSub.joinGroup('cm-status-updates');

        // On reconnect: ensure group membership and coalesce a single resync.
        const offConn = pubSub.onConnected(async () => {
          if (!mountedRef.current) return;
          try {
            await pubSub.joinGroup('cm-status-updates');
          } finally {

            scheduleFullSync(300);

          }
        });

        // On disconnect: show a warning; the service keeps retrying in the background.
        const offDisc = pubSub.onDisconnected(() => {
          if (!mountedRef.current) return;
      
        });

        // Handle incoming updates; apply locally, dedupe, and only fetch if needed.
        const offMsg = pubSub.onMessage<unknown>((raw) => {
          if (!mountedRef.current) return;

          // Optional: ignore if the backend includes a `channel` and it isn't ours.
          const channel = (raw as any)?.channel as string | undefined;
          if (channel && channel !== 'cm-status-updates') return;

          if (!isStatusUpdate(raw)) return;

          const key = `${raw.managerId}:${raw.status}:${raw.updatedAt ?? ''}`;
          if (seenUpdatesRef.current.has(key)) return;
          seenUpdatesRef.current.add(key);
          // Prevent unbounded growth of the dedup set.
          if (seenUpdatesRef.current.size > 500) {
            seenUpdatesRef.current = new Set(
              Array.from(seenUpdatesRef.current).slice(200),
            );
          }

          // Try to update locally; if the manager isn't present, coalesce a full sync.
          const ok = applyLocalUpdate(raw);
          if (!ok) scheduleFullSync(200);
        });

        // Cleanup listeners on unmount.
        return () => {
          offMsg?.();
          offConn?.();
          offDisc?.();
        };
      } catch (err: any) {
        setError(err);
      }
    })();

    return () => {
      mountedRef.current = false;
      if (fetchTimerRef.current != null) {
        clearTimeout(fetchTimerRef.current);
        fetchTimerRef.current = null;
      }
      // Do NOT disconnect the singleton here; other parts of the app may be using it.
    };
  }, [userEmail]); // `pubSub` is a singleton import; do not add it as a dependency.

  return {
    managers,
    loading,
    error,
    refresh: fetchManagers,
  };
}
