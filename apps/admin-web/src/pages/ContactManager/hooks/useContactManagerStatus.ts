import { useEffect, useState, useRef } from 'react';

import {
  getContactManagers,
  ContactManagerProfile as _CMP,
} from '@/shared/api/contactManagerClient';
import { useToast } from '@/shared/ui/ToastContext';
import { WebPubSubClientService } from '@/shared/api/webpubsubClient';


export type ContactManagerProfile = _CMP;

export interface ContactManagerStatusUpdate {
  managerId: string;
  status: 'Unavailable' | 'Available' | 'OnBreak' | 'OnAnotherTask';
  updatedAt: string;
}

/**
 * Hook for subscribing to real-time Contact Manager status updates.
 *
 * On mount:
 *  1. Fetches the full list of Contact Managers via `getContactManagers()`.
 *  2. Displays a loading spinner and clears any prior errors.
 *  3. Connects to Web PubSub with the given `userEmail`.
 *  4. Joins the `"cm-status-updates"` group.
 *  5. Listens for status‐update messages, and on each update:
 *     • Re-fetches the entire list to ensure the UI is in sync.
 *     • Shows a toast if reconnecting or on errors.
 *  6. On disconnect/reconnect, re-joins the group and re-fetches the list.
 *
 * @param userEmail - The normalized email of the current user (for PubSub auth).
 * @returns An object containing:
 *   - `managers`: the current array of `ContactManagerProfile`
 *   - `loading`: whether the full list is currently being fetched
 *   - `error`: any `Error` encountered during fetch or PubSub setup
 *   - `refresh`: a function to re-fetch the full list manually
 */
export function useContactManagerStatus(
  userEmail: string
): {
  managers: ContactManagerProfile[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
} {
  const [managers, setManagers] = useState<ContactManagerProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const { showToast } = useToast();

  const pubSubRef = useRef<WebPubSubClientService | null>(null);
  const listenerAdded = useRef(false);

  /** Fetch the full list from the API, manage loading/error, and toast on failure */
  const fetchManagers = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await getContactManagers();
      console.info('[CM status] fetched full list:', list.length);
      setManagers(list);
    } catch (err: any) {
      console.error('[CM status] fetch error', err);
      setError(err);
      showToast('Failed to load Contact Managers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userEmail) return;

    // Initial load
    fetchManagers();

    // Setup Web PubSub for real-time updates
    const pubSub = new WebPubSubClientService();
    pubSubRef.current = pubSub;

    pubSub
      .connect(userEmail)
      .then(() => {
        console.info('[CM status] connected as', userEmail);
        return pubSub.joinGroup('cm-status-updates');
      })
      .then(() => {
        console.info('[CM status] joined group "cm-status-updates"');

        if (!listenerAdded.current) {
          pubSub.onMessage<unknown>((raw) => {
            console.info('[CM status] received update:', raw);
            fetchManagers();
          });
          listenerAdded.current = true;
        }

        pubSub.onDisconnected(() => {
          console.warn('[CM status] disconnected — retrying');
          showToast('Disconnected from status updates, retrying...', 'warning');
        });

        pubSub.onConnected(async () => {
          console.info('[CM status] reconnected — rejoining & resyncing');
          showToast('Reconnected to status updates', 'success');
          await pubSub.joinGroup('cm-status-updates');
          await fetchManagers();
        });
      })
      .catch((err: any) => {
        console.error('[CM status] WebPubSub setup failed', err);
        setError(err);
        showToast('Failed to connect to status updates', 'error');
      });

    return () => {
      pubSub.disconnect();
      pubSubRef.current = null;
    };
  }, [userEmail]);

  return {
    managers,
    loading,
    error,
    refresh: fetchManagers,
  };
}
