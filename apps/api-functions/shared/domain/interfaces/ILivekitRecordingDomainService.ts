/**
 * @fileoverview ILivekitRecordingDomainService - Interface for LiveKit recording domain operations
 * @summary Defines contract for recording command business logic
 * @description Provides abstraction for recording command domain service layer
 */

import { RecordingCommand } from '../entities/RecordingCommand';
import { LivekitRecordingResponse } from '../value-objects/LivekitRecordingResponse';

/**
 * Interface for LiveKit recording domain service operations
 */
export interface ILivekitRecordingDomainService {
  /**
   * Starts a recording session
   * @param command - Recording command with all required parameters
   * @returns LivekitRecordingResponse with start recording details
   */
  startRecording(command: RecordingCommand): Promise<LivekitRecordingResponse>;

  /**
   * Stops active recording sessions
   * @param command - Recording command with all required parameters
   * @returns LivekitRecordingResponse with stop recording results
   */
  stopRecording(command: RecordingCommand): Promise<LivekitRecordingResponse>;
}

