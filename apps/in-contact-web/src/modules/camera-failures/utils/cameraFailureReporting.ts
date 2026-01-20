/**
 * @fileoverview Camera Failure Reporting Utility
 * @summary Utility functions for reporting camera failures to the backend
 * @description Provides centralized functions for reporting different types of camera failures,
 * including LiveKit connection errors and media permission errors. Encapsulates error
 * formatting and API interaction to keep reporting logic separate from business logic.
 */

import { logDebug } from '@/shared/utils/logger';
import { reportCameraFailure as apiReportCameraFailure } from '../api/cameraFailuresClient';
import { CameraFailureStage } from '../enums/cameraFailureStage';
import type {
  ReportLiveKitConnectionFailureOptions,
  ReportMediaPermissionFailureOptions,
} from '../types/cameraFailureTypes';

/**
 * Truncates a string to a maximum length
 * 
 * @param str - String to truncate
 * @param maxLength - Maximum length
 * @returns Truncated string
 */
function truncateString(str: string | undefined, maxLength: number): string | undefined {
  if (!str) return undefined;
  return str.length > maxLength ? str.substring(0, maxLength) : str;
}

/**
 * Normalizes device information for reporting
 * 
 * @param device - Media device info
 * @returns Normalized device object
 */
function normalizeDevice(device: globalThis.MediaDeviceInfo): {
  label: string | null;
  deviceId: string | null;
  groupId?: string | null;
  vendorId?: string;
  productId?: string;
} {
  return {
    label: device.label || null,
    deviceId: device.deviceId || null,
    groupId: device.groupId || null,
  };
}

/**
 * Gets the email of the user who initiated the last START command from localStorage
 * @returns Email of the command initiator or undefined if not found
 */
function getStoredInitiatorEmail(): string | undefined {
  try {
    const stored = localStorage.getItem('lastCommandInitiatorEmail');
    return stored || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Reports a LiveKit connection failure to the backend
 * 
 * @param options - Reporting options
 * @remarks Fails silently to avoid disrupting user experience
 */
export async function reportLiveKitConnectionFailure(
  options: ReportLiveKitConnectionFailureOptions
): Promise<void> {
  const { userAdId, userEmail, error, roomName, livekitUrl } = options;

  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const errorName = error instanceof Error ? error.name : 'Error';
  const initiatedByEmail = getStoredInitiatorEmail();

  try {
    await apiReportCameraFailure({
      stage: CameraFailureStage.LiveKitConnect,
      errorName: truncateString(errorName, 100),
      errorMessage: truncateString(errorMessage, 1000),
      initiatedByEmail,
      metadata: {
        userAdId,
        userEmail,
        roomName: roomName || undefined,
        livekitUrl: livekitUrl || undefined,
      },
    });
  } catch (reportError) {
    // Fail silently - logging already done in reportCameraFailure
    logDebug('[reportLiveKitConnectionFailure] Failed to report camera failure', {
      error: reportError,
      userEmail,
    });
  }
}

/**
 * Reports a media permission failure to the backend
 * 
 * @param options - Reporting options
 * @remarks Fails silently to avoid disrupting user experience
 */
export async function reportMediaPermissionFailure(
  options: ReportMediaPermissionFailureOptions
): Promise<void> {
  const {
    userAdId,
    userEmail,
    error,
    cameras = [],
    microphones = [],
    cameraBlocked = false,
    microphoneBlocked = false,
  } = options;

  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const errorName = error instanceof Error ? error.name : 'Error';
  const initiatedByEmail = getStoredInitiatorEmail();

  const devicesSnapshot = cameras.map(normalizeDevice);

  try {
    await apiReportCameraFailure({
      stage: CameraFailureStage.Permission,
      errorName: truncateString(errorName, 100),
      errorMessage: truncateString(errorMessage, 1000),
      deviceCount: devicesSnapshot.length,
      devicesSnapshot,
      initiatedByEmail,
      metadata: {
        userAdId,
        userEmail,
        cameraBlocked,
        microphoneBlocked,
        availableCameras: cameras.length,
        availableMicrophones: microphones.length,
      },
    });
  } catch (reportError) {
    // Fail silently - logging already done in reportCameraFailure
    logDebug('[reportMediaPermissionFailure] Failed to report camera failure', {
      error: reportError,
      userEmail,
    });
  }
}

