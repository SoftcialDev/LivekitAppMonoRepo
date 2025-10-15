// shared/presence/hooks/useMultiUserStreams.ts
import { getLiveKitToken, RoomWithToken } from '@/shared/api/livekitClient';
import { fetchStreamingSessions } from '@/shared/api/streamingStatusClient';
import { WebPubSubClientService } from '@/shared/api/webpubsubClient';
import { useState, useRef, useCallback, useEffect } from 'react';

interface StreamCreds {
  accessToken?: string;
  roomName?: string;
  livekitUrl?: string;
  loading: boolean;
}
export type CredsMap = Record<string, StreamCreds>;

/**
 * Streams hook:
 * - Never calls per-room token endpoints.
 * - ONE all-rooms token fetch per refresh (single-flight + TTL handled in client).
 * - Refresh triggers:
 *   * mount / viewer change
 *   * emails list gains a new Employee (presence)
 *   * PubSub START/started (debounced)
 * - Clears a PSO immediately on STOP/stopped or when it's removed from `emails`.
 */
export function useMultiUserStreams(viewerEmail: string, emails: string[]): CredsMap {
  const [credsMap, setCredsMap] = useState<CredsMap>({});
  const canceledUsersRef = useRef<Set<string>>(new Set());

  // Guards
  const inflightRef = useRef<Promise<void> | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevEmailsRef = useRef<Set<string>>(new Set());

  // Clear creds for one email (sync)
  const clearOne = useCallback((email: string) => {
    const key = email.toLowerCase();
    setCredsMap((prev) => ({
      ...prev,
      [key]: { loading: false, accessToken: undefined, roomName: undefined, livekitUrl: undefined },
    }));
  }, []);

  // Refresh all tokens once and fold into map for the current `emails` list
  const refreshAllTokens = useCallback(async () => {
    if (inflightRef.current) {
      await inflightRef.current;
      return;
    }
    const runner = (async () => {
      try {
        // Build email -> room lookup from sessions
        const sessions = await fetchStreamingSessions();
        const emailToRoom = new Map<string, string>();
        sessions.forEach((s: any) => {
          if (s?.email && s?.userId) emailToRoom.set(String(s.email).toLowerCase(), String(s.userId));
        });

        // ONE call: all rooms + tokens
        const { rooms, livekitUrl } = await getLiveKitToken();
        const byRoom = new Map<string, string>(); // roomId -> token
        (rooms as RoomWithToken[]).forEach((r) => byRoom.set(r.room, r.token));

        // Merge in a single state update
        setCredsMap((prev) => {
          const next: CredsMap = { ...prev };

          // Keep only the current emails
          const currentEmailSet = new Set(emails.map((e) => e.toLowerCase()));
          for (const k of Object.keys(next)) {
            if (!currentEmailSet.has(k)) delete next[k];
          }

          // Update/insert creds for each tracked email
          for (const email of currentEmailSet) {
            if (canceledUsersRef.current.has(email)) {
              next[email] = { loading: false };
              continue;
            }
            const room = emailToRoom.get(email);
            const token = room ? byRoom.get(room) : undefined;
            if (room && token) {
              next[email] = { accessToken: token, roomName: room, livekitUrl, loading: false };
            } else {
              next[email] = { loading: false };
            }
          }

          return next;
        });
      } finally {
        inflightRef.current = null;
      }
    })();

    inflightRef.current = runner;
    await runner;
  }, [emails]);

  // Debounced refresh scheduler
  const scheduleRefresh = useCallback((delayMs = 300) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      void refreshAllTokens();
    }, delayMs);
  }, [refreshAllTokens]);

  // Connect socket ONCE per viewer (singleton) and attach streaming message handlers
  useEffect(() => {
    const client = WebPubSubClientService.getInstance();

    (async () => {
      try {
        await client.connect(viewerEmail);
      } catch (e) {
        console.error('[useMultiUserStreams] connect failed', e);
      }

      client.onMessage<any>((msg) => {
        // Accept {command:'START'|'STOP', employeeEmail} or {email,status:'started'|'stopped'}
        let targetEmail: string | null = null;
        let started: boolean | null = null;

        if (msg?.command && msg?.employeeEmail) {
          targetEmail = String(msg.employeeEmail).toLowerCase();
          started = msg.command === 'START' ? true : msg.command === 'STOP' ? false : null;
        } else if (msg?.email && msg?.status) {
          targetEmail = String(msg.email).toLowerCase();
          started = msg.status === 'started' ? true : msg.status === 'stopped' ? false : null;
        }

        if (!targetEmail || !emails.includes(targetEmail)) return;

        if (started === true) {
          // un-cancel and refresh tokens for everyone (debounced)
          if (canceledUsersRef.current.has(targetEmail)) {
            const ns = new Set(canceledUsersRef.current);
            ns.delete(targetEmail);
            canceledUsersRef.current = ns;
          }
          scheduleRefresh();
        } else if (started === false) {
          // cancel and clear immediately
          const ns = new Set(canceledUsersRef.current);
          ns.add(targetEmail);
          canceledUsersRef.current = ns;
          clearOne(targetEmail);
        }
      });
    })();

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [viewerEmail, scheduleRefresh, clearOne, emails]);

  // Join/leave streaming groups incrementally when `emails` changes
  useEffect(() => {
    const client = WebPubSubClientService.getInstance();
    const prev = prevEmailsRef.current;
    const curr = new Set(emails.map((e) => e.toLowerCase()));

    const toJoin: string[] = [];
    const toLeave: string[] = [];

    curr.forEach((e) => { if (!prev.has(e)) toJoin.push(e); });
    prev.forEach((e) => { if (!curr.has(e)) toLeave.push(e); });

    prevEmailsRef.current = curr;

    // Best-effort join/leave; ignore errors
    toJoin.forEach((e) => { client.joinGroup(e).catch(() => {}); });
    toLeave.forEach((e) => { client.leaveGroup?.(e).catch?.(() => {}); });

    // When emails change (e.g., a new Employee came online), refresh once
    if (toJoin.length > 0) scheduleRefresh(100);

    // Also clear stale creds for removed emails
    if (toLeave.length > 0) {
      setCredsMap((prev) => {
        const copy = { ...prev };
        toLeave.forEach((e) => delete copy[e]);
        return copy;
      });
    }
  }, [emails, scheduleRefresh]);

  // Initial hydration
  useEffect(() => {
    if (emails.length > 0) void refreshAllTokens();
  }, [refreshAllTokens]);

  return credsMap;
}
