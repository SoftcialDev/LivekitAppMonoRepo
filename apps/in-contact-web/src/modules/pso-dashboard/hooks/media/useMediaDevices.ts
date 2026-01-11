/**
 * @fileoverview useMediaDevices - Media device management hook for PSO Dashboard
 * @summary Handles camera device enumeration, permissions, and track creation
 * @description Provides functionality to request media permissions, enumerate devices,
 * create video tracks with intelligent fallback, and handle device errors gracefully.
 * Configures video at 240p (320x240) with 15 fps.
 */

import { useCallback, useRef } from 'react';
import { LocalVideoTrack, createLocalVideoTrack } from 'livekit-client';
import { logWarn, logError } from '@/shared/utils/logger';
import { VIDEO_RESOLUTION, VIDEO_FRAME_RATE, BLOCKED_CAMERA_MODELS, PREFERRED_CAMERA_MODEL } from '../../constants';

/**
 * Requests camera permission once so that later track creation
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
  } catch (err: unknown) {
    const error = err as DOMException;
    if (error?.name === 'NotAllowedError') {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cams = devices.filter(d => d.kind === 'videoinput').map(c => c.label || c.deviceId);
      alert(
        `Camera access blocked.\nDetected cameras: ${cams.join(', ')}\n\n` +
          `Enable camera permissions for this site and refresh.`
      );
      throw error;
    }
    if (error?.name === 'NotReadableError') {
      logWarn('[MediaDevices] Default device busy, will try others', { error });
      return;
    }
    throw error;
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
 * - Always uses 240p (320x240) at 15 fps.
 *
 * @param cameras - Array of available video input devices
 * @returns Promise that resolves to a LocalVideoTrack
 * @throws {Error} When no camera can be accessed
 */
async function createVideoTrackWithFallback(cameras: MediaDeviceInfo[]): Promise<LocalVideoTrack> {
  // Filter out blocked camera models
  const filtered = cameras.filter((c) => {
    return !BLOCKED_CAMERA_MODELS.some((pattern) => pattern.test(c.label));
  });
  
  // Prioritize preferred camera model, then others
  const prioritized: MediaDeviceInfo[] = [];
  const preferred = filtered.find((c) => PREFERRED_CAMERA_MODEL.test(c.label));
  if (preferred) prioritized.push(preferred);
  for (const cam of filtered) if (cam !== preferred) prioritized.push(cam);

  for (const cam of prioritized) {
    try {
      const track = await createLocalVideoTrack({ 
        deviceId: { exact: cam.deviceId },
        resolution: {
          width: VIDEO_RESOLUTION.width,
          height: VIDEO_RESOLUTION.height,
          frameRate: VIDEO_FRAME_RATE
        }
      });
      return track;
    } catch (err: unknown) {
      const error = err as DOMException;
      if (error?.name === 'NotReadableError') {
        logWarn('[MediaDevices] Camera busy, trying next', { label: cam.label, error });
        continue;
      }
      logError('[MediaDevices] Failed to create video track from camera', { label: cam.label, error });
      throw error;
    }
  }

  // Fallback to default camera with 240p at 20 fps
  try {
    const track = await createLocalVideoTrack({
      resolution: {
        width: VIDEO_RESOLUTION.width,
        height: VIDEO_RESOLUTION.height,
        frameRate: VIDEO_FRAME_RATE
      }
    });
    return track;
  } catch (err: unknown) {
    const error = err as Error;
    logError('[MediaDevices] Failed to create video track from default device', { error });
    throw error;
  }
}

/**
 * Hook for managing media devices and track creation
 *
 * @remarks
 * Provides functionality to request camera permissions, enumerate devices,
 * create video tracks with intelligent fallback, and handle device cleanup.
 * All video tracks are created at 240p (320x240) with 15 fps.
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
   * @returns Promise that resolves to a LocalVideoTrack (240p at 15 fps)
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
   * @returns Promise that resolves to a LocalVideoTrack (240p at 15 fps)
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
        logWarn('[MediaDevices] Failed to stop video track', { error: err });
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
        logError('[MediaDevices] Failed to recreate video track', { error: err });
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

