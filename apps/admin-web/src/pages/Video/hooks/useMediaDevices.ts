/**
 * @fileoverview useMediaDevices - Media device management hook
 * @summary Handles camera and microphone device enumeration, permissions, and track creation
 * @description Provides functionality to request media permissions, enumerate devices,
 * create video tracks with intelligent fallback, and handle device errors gracefully.
 */

import { useCallback, useRef } from 'react';
import { LocalVideoTrack, createLocalVideoTrack } from 'livekit-client';

/**
 * Requests camera and microphone permission once so that later track creation
 * does not trigger new permission prompts.
 *
 * @remarks
 * - Immediately stops acquired tracks; this is only to prime permissions.
 * - Distinguishes `NotAllowedError` (permission denied) and `NotReadableError` (device busy).
 *
 * @throws {DOMException} Re-throws `NotAllowedError` and any unexpected errors.
 */
async function ensureCameraPermission(): Promise<void> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    stream.getTracks().forEach((t) => t.stop());
  } catch (err: any) {
    if (err?.name === 'NotAllowedError') {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cams = devices
        .filter((d) => d.kind === 'videoinput')
        .map((c) => c.label || `ID: ${c.deviceId}`);
      alert(
        `Camera access blocked.\nDetected cameras: ${cams.join(', ')}\n\n` +
          `Enable camera  permissions for this site and refresh.`,
      );
      throw err;
    }
    if (err?.name === 'NotReadableError') {
      console.warn('[Camera] Default device busy, will try others', err);
      return;
    }
    throw err;
  }
}

/**
 * Creates a `LocalVideoTrack` by prioritizing specific cameras and falling back gracefully.
 *
 * @remarks
 * Order:
 *  1) Camera with label containing "Logi C270 HD"
 *  2) Any other camera except those matching "Logitech C930e"
 *  3) Default camera
 *
 * - Filters out Logitech C930e devices from all attempts.
 * - If a camera is busy (`NotReadableError`), tries the next one.
 *
 * @param cameras - Array of available video input devices
 * @returns Promise that resolves to a LocalVideoTrack
 * @throws {Error} When no camera can be accessed
 */
async function createVideoTrackWithFallback(cameras: MediaDeviceInfo[]): Promise<LocalVideoTrack> {
  const filtered = cameras.filter((c) => !/Logi(?:tech)? C930e/i.test(c.label));
  const prioritized: MediaDeviceInfo[] = [];
  const c270 = filtered.find((c) => c.label.includes('Logi C270 HD'));
  if (c270) prioritized.push(c270);
  for (const cam of filtered) if (cam !== c270) prioritized.push(cam);

  for (const cam of prioritized) {
    try {
      return await createLocalVideoTrack({ 
        deviceId: { exact: cam.deviceId },
        resolution: {
          width: 320,
          height: 240,
          frameRate: 15
        }
      });
    } catch (err: any) {
      if (err?.name === 'NotReadableError') {
        console.warn(`[Camera] "${cam.label}" busy, trying next…`, err);
        continue;
      }
      throw err;
    }
  }

  // Force 240p resolution for all video tracks
  return createLocalVideoTrack({
    resolution: {
      width: 320,
      height: 240,
      frameRate: 15
    }
  });
}

/**
 * Hook for managing media devices and track creation
 *
 * @remarks
 * Provides functionality to request camera permissions, enumerate devices,
 * create video tracks with intelligent fallback, and handle device cleanup.
 *
 * @returns Object containing media device management functions
 */
export function useMediaDevices() {
  const videoTrackRef = useRef<LocalVideoTrack | null>(null);

  /**
   * Requests camera permission and handles permission errors
   *
   * @returns Promise that resolves when permission is granted
   * @throws {DOMException} When permission is denied or device is busy
   */
  const requestCameraPermission = useCallback(async (): Promise<void> => {
    await ensureCameraPermission();
  }, []);

  /**
   * Enumerates available video input devices
   *
   * @returns Promise that resolves to array of video input devices
   */
  const enumerateVideoDevices = useCallback(async (): Promise<MediaDeviceInfo[]> => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((d) => d.kind === 'videoinput');
  }, []);

  /**
   * Creates a video track with intelligent device fallback
   *
   * @param cameras - Array of available video input devices
   * @returns Promise that resolves to a LocalVideoTrack
   * @throws {Error} When no camera can be accessed
   */
  const createVideoTrack = useCallback(async (cameras: MediaDeviceInfo[]): Promise<LocalVideoTrack> => {
    const videoTrack = await createVideoTrackWithFallback(cameras);
    videoTrackRef.current = videoTrack;
    return videoTrack;
  }, []);

  /**
   * Creates a video track by first enumerating devices
   *
   * @returns Promise that resolves to a LocalVideoTrack
   * @throws {Error} When no camera can be accessed
   */
  const createVideoTrackFromDevices = useCallback(async (): Promise<LocalVideoTrack> => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cams = devices.filter((d) => d.kind === 'videoinput');
    return createVideoTrack(cams);
  }, [createVideoTrack]);

  /**
   * Stops and detaches the current video track
   */
  const stopVideoTrack = useCallback((): void => {
    if (videoTrackRef.current) {
      try {
        videoTrackRef.current.detach();
        videoTrackRef.current.stop();
        videoTrackRef.current = null;
      } catch (err) {
        console.warn('[MediaDevices] Failed to stop video track:', err);
      }
    }
  }, []);

  /**
   * Gets the current video track
   *
   * @returns Current video track or null if none exists
   */
  const getCurrentVideoTrack = useCallback((): LocalVideoTrack | null => {
    return videoTrackRef.current;
  }, []);

  /**
   * Checks if a video track is currently active
   *
   * @returns True if video track exists and is not ended
   */
  const isVideoTrackActive = useCallback((): boolean => {
    return videoTrackRef.current !== null && 
           videoTrackRef.current.mediaStreamTrack?.readyState !== 'ended';
  }, []);

  /**
   * Recreates video track if current one is ended
   *
   * @returns Promise that resolves to new video track or null if recreation failed
   */
  const recreateVideoTrackIfNeeded = useCallback(async (): Promise<LocalVideoTrack | null> => {
    if (videoTrackRef.current && videoTrackRef.current.mediaStreamTrack?.readyState === 'ended') {
      try {
        stopVideoTrack();
        const newTrack = await createVideoTrackFromDevices();
        return newTrack;
      } catch (err) {
        console.error('[MediaDevices] Failed to recreate video track:', err);
        return null;
      }
    }
    return videoTrackRef.current;
  }, [stopVideoTrack, createVideoTrackFromDevices]);

  return {
    requestCameraPermission,
    enumerateVideoDevices,
    createVideoTrack,
    createVideoTrackFromDevices,
    stopVideoTrack,
    getCurrentVideoTrack,
    isVideoTrackActive,
    recreateVideoTrackIfNeeded,
  };
}
