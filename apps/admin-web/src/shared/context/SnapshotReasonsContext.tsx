/**
 * @fileoverview SnapshotReasonsContext.tsx - Context for managing snapshot reasons
 * @summary Provides snapshot reasons to the entire application
 * @description Loads snapshot reasons once at app startup and provides them via Context
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SnapshotReasonsClient, SnapshotReason } from '../api/snapshotReasonsClient';

interface SnapshotReasonsContextType {
  reasons: SnapshotReason[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const SnapshotReasonsContext = createContext<SnapshotReasonsContextType | undefined>(undefined);

interface SnapshotReasonsProviderProps {
  children: ReactNode;
}

/**
 * Provider component that loads and manages snapshot reasons
 * @description Loads snapshot reasons once when the app starts and provides them via Context
 */
export function SnapshotReasonsProvider({ children }: SnapshotReasonsProviderProps): JSX.Element {
  const [reasons, setReasons] = useState<SnapshotReason[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const client = new SnapshotReasonsClient();

  const loadReasons = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await client.getSnapshotReasons();
      setReasons(data);
    } catch (err: any) {
      console.error('[SnapshotReasonsContext] Failed to load snapshot reasons:', err);
      setError(err.message || 'Failed to load snapshot reasons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReasons();
  }, []);

  return (
    <SnapshotReasonsContext.Provider value={{ reasons, loading, error, refresh: loadReasons }}>
      {children}
    </SnapshotReasonsContext.Provider>
  );
}

/**
 * Hook to access snapshot reasons from Context
 * @returns SnapshotReasonsContextType with reasons, loading state, error, and refresh function
 * @throws Error if used outside of SnapshotReasonsProvider
 */
export function useSnapshotReasons(): SnapshotReasonsContextType {
  const context = useContext(SnapshotReasonsContext);
  if (!context) {
    throw new Error('useSnapshotReasons must be used within SnapshotReasonsProvider');
  }
  return context;
}

