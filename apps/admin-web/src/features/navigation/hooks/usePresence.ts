// src/features/navigation/hooks/usePresence.ts
import { useState, useEffect, useCallback, useRef } from "react";
import type { UserStatus } from "../types/types";
import { fetchPresence } from "../services/presenceApi";
import { fetchStreamingSessions } from "../../../services/streamingStatusClient";

export interface UsePresenceResult {
  onlineUsers:  UserStatus[];
  offlineUsers: UserStatus[];
  streamingMap: Record<string, boolean>;
  loading: boolean;
  error:   string | null;
}

export interface UsePresenceOptions {
  /** Called once, after the initial REST snapshot succeeds. */
  onLoaded?: (online: UserStatus[], offline: UserStatus[]) => void;
}

/**
 * Fetches presence + active streams **exactly once** on mount.
 * Updates are expected to come from the Web-Socket layer.
 */
export function usePresence(
  opts: UsePresenceOptions = {},
): UsePresenceResult {
  const [onlineUsers,  setOnlineUsers]  = useState<UserStatus[]>([]);
  const [offlineUsers, setOfflineUsers] = useState<UserStatus[]>([]);
  const [streamingMap, setStreamingMap] = useState<Record<string, boolean>>({});
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);

  /* keep latest callback in a ref to avoid re-running the effect */
  const onLoadedRef = useRef(opts.onLoaded);
  onLoadedRef.current = opts.onLoaded;

  const loadAll = useCallback(async () => {
    try {
      /* presence */
      const { online = [], offline = [] } = await fetchPresence();

      /* streaming sessions */
      const sessions = await fetchStreamingSessions();
      const map: Record<string, boolean> = {};
      sessions.forEach((s) => (map[s.email] = true));

      /* set state */
      setOnlineUsers(online);
      setOfflineUsers(offline);
      setStreamingMap(map);

      /* notify parent (only once) */
      onLoadedRef.current?.(online, offline);
    } catch (err: any) {
      console.error("Error loading presence/streaming", err);
      setError(err.message ?? "Failed to load presence");
    } finally {
      setLoading(false);
    }
  }, []);

  /* run exactly once on mount */
  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return { onlineUsers, offlineUsers, streamingMap, loading, error };
}
