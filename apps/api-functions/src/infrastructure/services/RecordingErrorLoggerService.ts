/**
 * @fileoverview RecordingErrorLoggerService - Infrastructure service for recording error logging
 * @summary Implements IRecordingErrorLogger for recording error logging
 * @description Infrastructure implementation of recording error logger service
 */

import { IRecordingErrorLogger } from '../../domain/interfaces/IRecordingErrorLogger';
import { RecordingErrorInfo, RecordingErrorContext } from '../../domain/types/RecordingErrorTypes';
import { IErrorLogService } from '../../domain/interfaces/IErrorLogService';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { logRecordingError } from './recordingErrorLogger';

/**
 * Infrastructure service for recording error logging operations
 * @description Implements IRecordingErrorLogger using recordingErrorLogger utility
 */
export class RecordingErrorLoggerService implements IRecordingErrorLogger {
  constructor(
    private readonly errorLogService?: IErrorLogService,
    private readonly userRepository?: IUserRepository
  ) {}

  async logError(errorInfo: RecordingErrorInfo, context: RecordingErrorContext): Promise<void> {
    await logRecordingError(
      this.errorLogService,
      this.userRepository,
      errorInfo,
      context
    );
  }
}

