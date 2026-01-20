/**
 * @fileoverview Error Handling Utilities for Streaming Dashboard
 * @summary Helper functions for handling and reporting streaming errors
 * @description Provides centralized error handling functions that report errors
 * to the backend without throwing exceptions. Keeps error reporting logic separate
 * from business logic and prevents error handling from disrupting user experience.
 */

import { logDebug, logError } from '@/shared/utils/logger';
import {
  reportLiveKitConnectionFailure,
  reportMediaPermissionFailure,
} from '@/modules/camera-failures/utils/cameraFailureReporting';
import { MediaPermissionError } from '@/shared/errors';
import type {
  HandlePermissionErrorOptions,
  HandleConnectionErrorOptions,
} from '../types/errorHandlingTypes';

/**
 * Handles a media permission error by reporting it to the backend
 * 
 * Does not throw errors - only reports and logs them.
 * 
 * @param options - Error handling options
 * @returns True if error was reported, false otherwise
 */
export async function handlePermissionError(
  options: HandlePermissionErrorOptions
): Promise<boolean> {
  const { userAdId, userEmail, error } = options;

  if (!userAdId || !userEmail) {
    logDebug('[handlePermissionError] Skipping report - missing user info', {
      hasUserAdId: !!userAdId,
      hasUserEmail: !!userEmail,
    });
    return false;
  }

  if (!(error instanceof MediaPermissionError)) {
    logDebug('[handlePermissionError] Error is not MediaPermissionError, skipping report', {
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    });
    return false;
  }

  try {
    await reportMediaPermissionFailure({
      userAdId,
      userEmail,
      error,
      cameras: error.cameras,
      microphones: error.microphones,
      cameraBlocked: error.cameraBlocked,
      microphoneBlocked: error.microphoneBlocked,
    });
    return true;
  } catch (reportError) {
    logDebug('[handlePermissionError] Failed to report permission error', {
      error: reportError,
      userEmail,
    });
    return false;
  }
}

/**
 * Handles a LiveKit connection error by reporting it to the backend
 * 
 * Does not throw errors - only reports and logs them.
 * 
 * @param options - Error handling options
 * @returns True if error was reported, false otherwise
 */
export async function handleConnectionError(
  options: HandleConnectionErrorOptions
): Promise<boolean> {
  const { userAdId, userEmail, error, roomName, livekitUrl } = options;

  if (!userAdId || !userEmail) {
    logDebug('[handleConnectionError] Skipping report - missing user info', {
      hasUserAdId: !!userAdId,
      hasUserEmail: !!userEmail,
    });
    return false;
  }

  try {
    await reportLiveKitConnectionFailure({
      userAdId,
      userEmail,
      error,
      roomName,
      livekitUrl,
    });
    return true;
  } catch (reportError) {
    logDebug('[handleConnectionError] Failed to report connection error', {
      error: reportError,
      userEmail,
    });
    return false;
  }
}

/**
 * Wraps an async function to automatically report errors without throwing
 * 
 * @param fn - Function to execute
 * @param errorHandler - Error handler to call if function fails
 * @returns Result of the function or undefined if it failed
 */
export async function withErrorReporting<T>(
  fn: () => Promise<T>,
  errorHandler: (error: unknown) => Promise<boolean>
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    logError('[withErrorReporting] Operation failed', { error });
    await errorHandler(error);
    return undefined;
  }
}

