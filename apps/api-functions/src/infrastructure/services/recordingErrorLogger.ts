/**
 * @fileoverview recordingErrorLogger - Helper for logging recording-related errors
 * @summary Centralizes error logging logic for recording operations
 * @description Provides utility functions for consistent error logging in recording services
 */

import { IErrorLogService } from '../../domain/interfaces/IErrorLogService';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { ErrorSource } from '../../domain/enums/ErrorSource';
import { ErrorSeverity } from '../../domain/enums/ErrorSeverity';
import { ApiEndpoints } from '../../domain/constants/ApiEndpoints';
import { FunctionNames } from '../../domain/constants/FunctionNames';

/**
 * Gets subject user email for error logging
 * @param userRepository - User repository instance
 * @param subjectUserId - Subject user ID
 * @returns User email or undefined if not found
 */
async function getSubjectUserEmail(
  userRepository: IUserRepository | undefined,
  subjectUserId: string | null | undefined
): Promise<string | undefined> {
  if (!userRepository || !subjectUserId) {
    return undefined;
  }

  try {
    const subjectUser = await userRepository.findById(subjectUserId);
    return subjectUser?.email;
  } catch {
    return undefined;
  }
}

/**
 * Logs a recording error with full context
 * @param errorLogService - Error log service instance
 * @param userRepository - User repository instance
 * @param error - Error to log
 * @param context - Error context
 */
export async function logRecordingError(
  errorLogService: IErrorLogService | undefined,
  userRepository: IUserRepository | undefined,
  error: {
    message: string;
    name?: string;
    stack?: string;
  },
  context: {
    sessionId?: string | null;
    egressId?: string;
    roomName?: string;
    subjectUserId?: string | null;
    initiatorUserId?: string;
    egressStatus?: string;
    egressError?: string;
    clusterErrorDetails?: any;
    failureReason?: string;
    credentialsSentToLiveKit?: any;
    stopError?: string;
  }
): Promise<void> {
  if (!errorLogService) {
    return;
  }

  try {
    const subjectUserEmail = await getSubjectUserEmail(
      userRepository,
      context.subjectUserId
    );

    const errorObj = new Error(error.message);
    errorObj.name = error.name || 'RecordingError';
    if (error.stack) {
      errorObj.stack = error.stack;
    }

    await errorLogService.logError({
      source: ErrorSource.Recording,
      severity: ErrorSeverity.High,
      endpoint: ApiEndpoints.RECORDING,
      functionName: FunctionNames.LIVEKIT_RECORDING,
      error: errorObj,
      userId: context.initiatorUserId,
      userEmail: subjectUserEmail,
      context: {
        sessionId: context.sessionId || undefined,
        egressId: context.egressId,
        roomName: context.roomName || undefined,
        subjectUserId: context.subjectUserId || undefined,
        egressStatus: context.egressStatus,
        egressError: context.egressError,
        clusterErrorDetails: context.clusterErrorDetails,
        failureReason: context.failureReason,
        credentialsSentToLiveKit: context.credentialsSentToLiveKit,
        stopError: context.stopError,
      },
    });
  } catch {
    // Failed to log error - fail silently
  }
}

