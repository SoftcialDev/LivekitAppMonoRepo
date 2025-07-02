import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '../features/auth/hooks/useAuth';
import { useUserStream } from '../features/videoDashboard/hooks/useUserStream';

interface UserStreamState {
  accessToken?: string;
  roomName?: string;
  livekitUrl?: string;
  loading: boolean;
}

/** Context value for a single target’s LiveKit credentials. */
const UserStreamContext = createContext<UserStreamState | undefined>(undefined);

interface UserStreamProviderProps {
  /** Email of the target user whose stream you want to watch */
  targetEmail: string;
  children: ReactNode;
}

/**
 * Wraps `useUserStream(viewerEmail, targetEmail)` in a Context so that
 * any nested component can `useUserStreamContext()` without manual prop‐drilling.
 */
export const UserStreamProvider: React.FC<UserStreamProviderProps> = ({
  targetEmail,
  children,
}) => {
  const { account } = useAuth();
  const viewerEmail = account?.username ?? '';
  const streamState = useUserStream(viewerEmail, targetEmail);

  return (
    <UserStreamContext.Provider value={streamState}>
      {children}
    </UserStreamContext.Provider>
  );
};

/**
 * Must be called inside a <UserStreamProvider>/
 */
export function useUserStreamContext(): UserStreamState {
  const ctx = useContext(UserStreamContext);
  if (!ctx) {
    throw new Error('useUserStreamContext must be used within a UserStreamProvider');
  }
  return ctx;
}
