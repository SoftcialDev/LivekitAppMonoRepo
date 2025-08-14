import { useState, useCallback } from 'react';
import { useToast } from '@/shared/ui/ToastContext';
import { startRecording, stopRecording } from '@/shared/api/recordingCommandClient';

export function useRecording(roomName: string , name: string) {
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const toggleRecording = useCallback(async () => {
    if (loading) return;

    try {
      setLoading(true);

      if (!isRecording) {
        await startRecording(roomName);
        setIsRecording(true);
        showToast(`Recording started for ${name}`);
      } else {
        await stopRecording(roomName);
        setIsRecording(false);
        showToast(`Recording stopped for ${name}`);
      }
    } catch (err) {
      console.error('Recording toggle failed', err);
      showToast(`Failed to ${isRecording ? 'stop' : 'start'} recording`);
    } finally {
      setLoading(false);
    }
  }, [isRecording, roomName, loading, showToast]);

  return {
    isRecording,
    loading,
    toggleRecording,
  };
}
