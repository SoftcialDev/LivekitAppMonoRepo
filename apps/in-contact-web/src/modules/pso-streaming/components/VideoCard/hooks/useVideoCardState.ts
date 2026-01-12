/**
 * @fileoverview useVideoCardState - Custom hook for VideoCard state management
 * @summary Provides computed state values for VideoCard component
 * @description Centralizes state computation logic to reduce cognitive complexity
 */

import { useMemo } from 'react';
import { UserRole } from '@/modules/auth/enums';
import type {
  IUseVideoCardStateOptions,
  IUseVideoCardStateReturn,
} from '../types/useVideoCardStateTypes';

/**
 * Hook that computes state values for VideoCard component
 * 
 * @param options - Configuration options
 * @returns Object containing computed state values
 */
export function useVideoCardState(
  options: IUseVideoCardStateOptions
): IUseVideoCardStateReturn {
  const {
    shouldStream,
    connecting,
    disconnecting,
    disableControls,
    currentRole,
    isTalking,
    isCountdownActive,
    countdown,
    talkLoading,
    recordingLoading,
  } = options;

  const mediaReady = useMemo(() => shouldStream && !connecting && !disconnecting, [shouldStream, connecting, disconnecting]);

  const playLabel = useMemo(() => {
    if (disconnecting) return 'Disconnecting...';
    if (connecting) return 'Connecting…';
    return shouldStream ? 'Stop' : 'Play';
  }, [connecting, disconnecting, shouldStream]);

  const isPlayDisabled = useMemo(() => disableControls || connecting || disconnecting, [disableControls, connecting, disconnecting]);

  const talkLabel = useMemo(() => {
    if (isCountdownActive) {
      return `Starting... ${countdown}`;
    }
    return isTalking ? 'Stop Talk' : 'Talk';
  }, [isCountdownActive, countdown, isTalking]);

  const talkDisabled = useMemo(() => !mediaReady || talkLoading, [mediaReady, talkLoading]);
  const recordDisabled = useMemo(() => !mediaReady || recordingLoading, [mediaReady, recordingLoading]);
  const snapshotDisabled = useMemo(() => !mediaReady, [mediaReady]);

  const isAdmin = useMemo(() => {
    return (
      currentRole === UserRole.Admin ||
      currentRole === UserRole.SuperAdmin ||
      currentRole === UserRole.Supervisor
    );
  }, [currentRole]);

  const canTalkControl = isAdmin;
  const canSnapshot = isAdmin;
  const canRecord = isAdmin;

  return {
    mediaReady,
    playLabel,
    isPlayDisabled,
    talkLabel,
    talkDisabled,
    recordDisabled,
    snapshotDisabled,
    canTalkControl,
    canSnapshot,
    canRecord,
  };
}

