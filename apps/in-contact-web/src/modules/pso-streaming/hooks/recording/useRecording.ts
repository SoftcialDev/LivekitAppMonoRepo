/**
 * @fileoverview useRecording hook
 * @summary Hook for managing LiveKit recording operations
 * @description Provides functionality to start and stop LiveKit recordings for a room
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/ui-kit/feedback';
import { startRecording, stopRecording } from '../../api/recordingCommandClient';
import { logError } from '@/shared/utils/logger';
import type { IUseRecordingReturn } from './types/useRecordingTypes';

/**
 * Hook for managing LiveKit recording operations
 * 
 * @param roomName - Name of the LiveKit room to record
 * @param name - Display name for the recording (used in toast notifications)
 * @returns IUseRecordingReturn object with recording state and control functions
 */
export function useRecording(roomName: string, name: string): IUseRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const latestRoomNameRef = useRef(roomName);

  // Track last known room name so we can stop recordings even if the prop is cleared
  useEffect(() => {
    if (roomName) {
      latestRoomNameRef.current = roomName;
    }
  }, [roomName]);

  /**
   * Stops recording if currently active
   */
  const stopRecordingIfActive = useCallback(async () => {
    if (!isRecording) return;

    const targetRoom = roomName || latestRoomNameRef.current;
    if (!targetRoom) return;

    try {
      setLoading(true);
      await stopRecording(targetRoom);
      setIsRecording(false);
      showToast(`Recording stopped for ${name}`, 'success');
    } catch (err) {
      logError('Recording stop failed', { error: err });
      showToast('Failed to stop recording', 'error');
    } finally {
      setLoading(false);
    }
  }, [isRecording, roomName, name, showToast]);

  /**
   * Toggles recording state (start if not recording, stop if recording)
   */
  const toggleRecording = useCallback(async () => {
    // Still guard start by current room name; stop path can use last known name
    if (loading || (!isRecording && !roomName)) return;

    try {
      setLoading(true);

      if (!isRecording) {
        await startRecording(roomName);
        setIsRecording(true);
        showToast(`Recording started for ${name}`, 'success');
      } else {
        await stopRecordingIfActive();
      }
    } catch (err) {
      logError('Recording toggle failed', { error: err });
      showToast(`Failed to ${isRecording ? 'stop' : 'start'} recording`, 'error');
    } finally {
      setLoading(false);
    }
  }, [isRecording, roomName, name, loading, showToast, stopRecordingIfActive]);

  return {
    isRecording,
    loading,
    toggleRecording,
    stopRecordingIfActive,
  };
}

