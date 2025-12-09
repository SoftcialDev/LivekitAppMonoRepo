import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/shared/ui/ToastContext';
import { startRecording, stopRecording } from '@/shared/api/recordingCommandClient';

export function useRecording(roomName: string , name: string) {
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

  const stopRecordingIfActive = useCallback(async () => {
    if (!isRecording) return;

    const targetRoom = roomName || latestRoomNameRef.current;
    if (!targetRoom) return;

    try {
      setLoading(true);
      await stopRecording(targetRoom);
      setIsRecording(false);
      showToast(`Recording stopped for ${name}`);
    } catch (err) {
      console.error('Recording stop failed', err);
      showToast('Failed to stop recording');
    } finally {
      setLoading(false);
    }
  }, [isRecording, roomName, name, showToast]);

  const toggleRecording = useCallback(async () => {
    // Still guard start by current room name; stop path can use last known name
    if (loading || (!isRecording && !roomName)) return;

    try {
      setLoading(true);

      if (!isRecording) {
        await startRecording(roomName);
        setIsRecording(true);
        showToast(`Recording started for ${name}`);
      } else {
        await stopRecordingIfActive();
      }
    } catch (err) {
      console.error('Recording toggle failed', err);
      showToast(`Failed to ${isRecording ? 'stop' : 'start'} recording`);
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
