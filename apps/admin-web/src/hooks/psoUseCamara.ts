import { useCallback } from 'react';
import { LocalVideoTrack, createLocalVideoTrack } from 'livekit-client';

/**
 * Hook that provides camera permission management and video-track creation
 * with device fallback.
 */
export function useCamera() {
  /**
   * Requests camera access once.
   *
   * - If the user denies (NotAllowedError), alerts detected cameras and asks to
   *   enable & refresh.
   * - If the default device is busy (NotReadableError), logs a warning and returns.
   *
   * @throws NotAllowedError if permission is denied.
   */
  const ensureCameraPermission = useCallback(async (): Promise<void> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(t => t.stop());
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cams = devices
          .filter(d => d.kind === 'videoinput')
          .map(c => c.label || `ID: ${c.deviceId}`);
        alert(
          `Camera access blocked.\nDetected cameras: ${cams.join(', ')}\n\n` +
          `Please enable camera permission for this site in your browser settings and refresh.`
        );
        throw err;
      }
      if (err.name === 'NotReadableError') {
        console.warn('[Camera] Default device busy, will try others', err);
        return;
      }
      throw err;
    }
  }, []);

  /**
   * Tries to create a `LocalVideoTrack` in this order:
   *  1. “Logi C270 HD”
   *  2. Any other camera (excluding any “Logitech C930e”)
   * If a device fails with `NotReadableError`, moves on to the next.
   * If all attempts fail, falls back to default camera.
   *
   * @param cameras List of `videoinput` devices.
   * @returns A working `LocalVideoTrack`.
   * @throws Any error other than `NotReadableError`.
   */
  const createVideoTrackWithFallback = useCallback(
    async (cameras: MediaDeviceInfo[]): Promise<LocalVideoTrack> => {
      // Exclude C930e
      const filtered = cameras.filter(c => !/Logi(?:tech)? C930e/i.test(c.label));
      const prioritized: MediaDeviceInfo[] = [];
      // Prefer C270
      const c270 = filtered.find(c => c.label.includes('Logi C270 HD'));
      if (c270) prioritized.push(c270);
      for (const cam of filtered) {
        if (cam !== c270) prioritized.push(cam);
      }

      // Try each in order
      for (const cam of prioritized) {
        try {
          return await createLocalVideoTrack({ deviceId: { exact: cam.deviceId } });
        } catch (err: any) {
          if (err.name === 'NotReadableError') {
            console.warn(`[Camera] "${cam.label}" busy, trying next…`, err);
            continue;
          }
          throw err;
        }
      }

      // Last resort: default
      return createLocalVideoTrack();
    },
    []
  );

  return { ensureCameraPermission, createVideoTrackWithFallback };
}
