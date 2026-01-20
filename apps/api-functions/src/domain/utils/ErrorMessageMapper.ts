/**
 * @fileoverview ErrorMessageMapper - Utility for mapping technical errors to user-friendly messages
 * @summary Converts camera failure errors to readable messages
 * @description Maps error stages and messages to friendly, actionable messages for end users
 */

import { CameraFailureStage } from '@prisma/client';

/**
 * Error pattern matchers for specific error scenarios
 */
const ERROR_PATTERNS = {
  deviceInUse: /already in use|device.*busy|device.*occupied|in use by another/i,
  timeout: /timeout|timed out/i,
  network: /failed to fetch|network|connection.*refused/i,
  connectionInProgress: /already in progress|connection already/i,
  notFound: /not found|no devices|device.*not found/i,
  permission: /permission|denied|blocked/i,
  microphone: /microphone|mic/i,
  notReadable: /not readable|cannot read|read error/i,
} as const;

/**
 * Extracts application name from error message if available
 * Some browsers may include app names in error messages
 */
function extractAppName(errorMessage?: string | null): string | null {
  if (!errorMessage) return null;
  
  // Try to extract app name from common error patterns
  const appNameMatch = errorMessage.match(/(?:used by|in use by|occupied by)\s+([^.,;:]+)/i);
  if (appNameMatch && appNameMatch[1]) {
    return appNameMatch[1].trim();
  }
  
  return null;
}

/**
 * Maps permission-related errors to user-friendly messages
 */
function getPermissionErrorMessage(
  errorMessage?: string | null,
  errorName?: string | null
): string {
  if (errorName === 'MediaPermissionError' || ERROR_PATTERNS.permission.test(errorMessage || '')) {
    if (ERROR_PATTERNS.microphone.test(errorMessage || '')) {
      return 'Microphone access blocked. Please enable microphone permissions for this site and refresh the page.';
    }
    return 'Camera access blocked. Please enable camera permissions for this site and refresh the page.';
  }
  
  return 'Device permissions blocked. Please enable camera and microphone permissions in your browser settings.';
}

/**
 * Maps LiveKit connection errors to user-friendly messages
 */
function getLiveKitConnectionErrorMessage(errorMessage?: string | null): string {
  if (ERROR_PATTERNS.timeout.test(errorMessage || '')) {
    return 'Connection timeout. Please check your internet connection and try again.';
  }
  
  if (ERROR_PATTERNS.network.test(errorMessage || '')) {
    return 'Network error. Please check your internet connection and try again.';
  }
  
  if (ERROR_PATTERNS.connectionInProgress.test(errorMessage || '')) {
    return 'Connection already in progress. Please wait a moment and try again.';
  }
  
  return 'Failed to connect to video server. Please try again in a few moments.';
}

/**
 * Maps device enumeration errors to user-friendly messages
 */
function getDeviceEnumerationErrorMessage(errorMessage?: string | null): string {
  if (ERROR_PATTERNS.notFound.test(errorMessage || '')) {
    return 'No video devices found. Please verify that your camera is connected and working.';
  }
  
  return 'Error accessing video devices. Please check your camera settings.';
}

/**
 * Maps track creation errors to user-friendly messages
 */
function getTrackCreationErrorMessage(errorMessage?: string | null): string {
  const appName = extractAppName(errorMessage);
  
  if (ERROR_PATTERNS.deviceInUse.test(errorMessage || '')) {
    if (appName) {
      return `Camera is already in use by ${appName}. Please close that application and try again.`;
    }
    return 'Camera is already in use by another application. Please close other applications using the camera and try again.';
  }
  
  if (ERROR_PATTERNS.notReadable.test(errorMessage || '')) {
    return 'Camera cannot be accessed. Please check if another application is using the camera and try again.';
  }
  
  return 'Failed to start video stream. Please try again or check your camera settings.';
}

/**
 * Maps publishing errors to user-friendly messages
 */
function getPublishingErrorMessage(errorMessage?: string | null): string {
  return 'Failed to publish video stream. Please try again or check your connection.';
}

/**
 * Maps camera failure errors to user-friendly messages
 * 
 * @param stage - The failure stage where the error occurred
 * @param errorMessage - The technical error message
 * @param errorName - The technical error name/type
 * @returns User-friendly error message string
 */
export function getFriendlyErrorMessage(
  stage: CameraFailureStage,
  errorMessage?: string | null,
  errorName?: string | null
): string {
  switch (stage) {
    case CameraFailureStage.Permission:
      return getPermissionErrorMessage(errorMessage, errorName);
    
    case CameraFailureStage.LiveKitConnect:
      return getLiveKitConnectionErrorMessage(errorMessage);
    
    case CameraFailureStage.Enumerate:
      return getDeviceEnumerationErrorMessage(errorMessage);
    
    case CameraFailureStage.TrackCreate:
      return getTrackCreationErrorMessage(errorMessage);
    
    case CameraFailureStage.Publish:
      return getPublishingErrorMessage(errorMessage);
    
    case CameraFailureStage.Unknown:
    default:
      return errorMessage || 'Unknown error occurred while starting the camera. Please try again or contact support.';
  }
}

