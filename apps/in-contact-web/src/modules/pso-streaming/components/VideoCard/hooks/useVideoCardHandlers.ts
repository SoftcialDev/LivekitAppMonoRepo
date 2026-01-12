/**
 * @fileoverview useVideoCardHandlers - Custom hook for VideoCard button handlers
 * @summary Provides handlers for video card control buttons
 * @description Centralizes complex handler logic for video card controls to reduce cognitive complexity in the main component
 */

import { useCallback } from 'react';
import { useToast } from '@/ui-kit/feedback';
import type { StreamingStopReason } from '../../../enums/streamingStopReason';
import type {
  IUseVideoCardHandlersOptions,
  IUseVideoCardHandlersReturn,
} from '../types/useVideoCardHandlersTypes';

/**
 * Hook that provides stable handlers for video card control buttons
 * 
 * @param options - Configuration options
 * @returns Object containing handler functions
 */
export function useVideoCardHandlers(
  options: IUseVideoCardHandlersOptions
): IUseVideoCardHandlersReturn {
  const {
    email,
    onToggle,
    onChat,
    isCountdownActive,
    isTalking,
    cancelTalk,
    stopTalk,
    startTalk,
    activeSupervisorName,
    activeSupervisorEmail,
    openModal,
    toggleRecording,
  } = options;

  const { showToast } = useToast();

  const handleStopReasonSelect = useCallback(
    (reason: StreamingStopReason): void => {
      // Pass enum as string (enum values are strings in TypeScript)
      onToggle?.(email, reason);
    },
    [email, onToggle]
  );

  const handlePlayClick = useCallback((): void => {
    onToggle?.(email);
  }, [email, onToggle]);

  const handleChatClick = useCallback((): void => {
    onChat(email);
  }, [email, onChat]);

  const handleTalkClick = useCallback(async (): Promise<void> => {
    if (isCountdownActive) {
      cancelTalk();
    } else if (isTalking) {
      await stopTalk();
    } else {
      try {
        await startTalk();
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to start talk session';
        
        if (errorMessage.includes('already has an active talk session')) {
          const supervisorDisplayName = activeSupervisorName || activeSupervisorEmail || 'another supervisor';
          showToast(
            `PSO already has an active talk session with ${supervisorDisplayName}. Please wait for it to end.`,
            'error'
          );
        } else {
          showToast(errorMessage, 'error');
        }
      }
    }
  }, [isCountdownActive, isTalking, cancelTalk, stopTalk, startTalk, activeSupervisorName, activeSupervisorEmail, showToast]);

  const handleSnapshotClick = useCallback((): void => {
    openModal();
  }, [openModal]);

  const handleRecordClick = useCallback(async (): Promise<void> => {
    try {
      await toggleRecording();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to toggle recording';
      showToast(errorMessage, 'error');
    }
  }, [toggleRecording, showToast]);

  return {
    handleStopReasonSelect,
    handlePlayClick,
    handleChatClick,
    handleTalkClick,
    handleSnapshotClick,
    handleRecordClick,
  };
}

