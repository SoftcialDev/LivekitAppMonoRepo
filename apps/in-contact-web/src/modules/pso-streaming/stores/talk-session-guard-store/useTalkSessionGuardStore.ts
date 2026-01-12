/**
 * @fileoverview Talk Session Guard Store
 * @summary Store for tracking active talk sessions to prevent navigation
 * @description Zustand store that tracks active talk sessions and their stop functions
 * to enable navigation blocking during active talk sessions
 */

import { create } from 'zustand';
import { logError } from '@/shared/utils/logger';
import type { ITalkSessionGuardState } from './types/talkSessionGuardStoreTypes';

/**
 * Zustand store for talk session guard
 */
export const useTalkSessionGuardStore = create<ITalkSessionGuardState>((set, get) => ({
  activeSessions: new Map(),

  registerSession: (email: string, stopFunction: () => Promise<void>) => {
    set((state) => {
      const newSessions = new Map(state.activeSessions);
      newSessions.set(email.toLowerCase(), {
        email: email.toLowerCase(),
        stopFunction,
        registeredAt: Date.now(),
      });
      return { activeSessions: newSessions };
    });
  },

  unregisterSession: (email: string) => {
    set((state) => {
      const newSessions = new Map(state.activeSessions);
      newSessions.delete(email.toLowerCase());
      return { activeSessions: newSessions };
    });
  },

  hasActiveSessions: () => {
    return get().activeSessions.size > 0;
  },

  getActiveSessionEmails: () => {
    return Array.from(get().activeSessions.keys());
  },

  stopAllSessions: async () => {
    const { activeSessions } = get();
    const stopPromises = Array.from(activeSessions.values()).map((registration) =>
      registration.stopFunction().catch((error) => {
        // Log error but don't throw - we want to stop all sessions even if one fails
        logError('[TalkSessionGuard] Failed to stop session', { error, email: registration.email });
      })
    );
    await Promise.all(stopPromises);
  },
}));


