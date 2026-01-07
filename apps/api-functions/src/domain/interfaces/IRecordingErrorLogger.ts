/**
 * @fileoverview IRecordingErrorLogger - Interface for recording error logging operations
 * @summary Defines contract for recording error logging
 * @description Provides abstraction for recording error logging in infrastructure layer
 */

import { RecordingErrorInfo, RecordingErrorContext } from '../types/RecordingErrorTypes';

/**
 * Interface for recording error logging operations
 * @description Handles logging of recording-related errors
 */
export interface IRecordingErrorLogger {
  /**
   * Logs a recording-related error
   * @param errorInfo - Error information to log
   * @param context - Additional context for the error
   */
  logError(errorInfo: RecordingErrorInfo, context: RecordingErrorContext): Promise<void>;
}

