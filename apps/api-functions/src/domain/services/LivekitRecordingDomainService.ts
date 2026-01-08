/**
 * @fileoverview LivekitRecordingDomainService - Domain service for LiveKit recording operations
 * @summary Encapsulates recording command business logic
 * @description Handles recording command domain operations with business rules and LiveKit integration
 */

import { ILivekitRecordingDomainService } from '../interfaces/ILivekitRecordingDomainService';
import { RecordingCommand } from '../entities/RecordingCommand';
import { LivekitRecordingResponse } from '../value-objects/LivekitRecordingResponse';
import { RecordingResultItem } from '../value-objects/LivekitRecordingResponse';
import { RecordingSessionApplicationService } from '../../application/services/RecordingSessionApplicationService';
import { 
  RecordingStartError,
  RecordingStopError,
  NoActiveRecordingsError,
  RecordingCommandError
} from '../errors/RecordingErrors';

/**
 * Domain service for LiveKit recording command operations
 * 
 * @param applicationService - Application service for recording session orchestration
 */
export class LivekitRecordingDomainService implements ILivekitRecordingDomainService {
  constructor(
    private readonly applicationService: RecordingSessionApplicationService
  ) {}

  /**
   * Starts a recording session using LiveKit and persists the session
   * @param command - Recording command with all required parameters
   * @returns LivekitRecordingResponse with start recording details
   * @throws RecordingStartError when recording start fails
   */
  async startRecording(command: RecordingCommand): Promise<LivekitRecordingResponse> {
    try {
      if (!command.isStartCommand()) {
        throw new RecordingCommandError("Invalid command type for start recording");
      }

      const result = await this.applicationService.startRecordingSession({
        roomName: command.roomName,
        subjectLabel: command.subjectUserId || command.roomName,
        initiatorUserId: command.initiatorUserId,
        subjectUserId: command.subjectUserId
      });

      return LivekitRecordingResponse.forStartCommand(
        `Recording started for room "${command.roomName}".`,
        command.roomName,
        result.egressId,
        result.blobPath
      );
    } catch (error) {
      throw new RecordingStartError(`Failed to start recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stops active recording sessions and returns results
   * @param command - Recording command with all required parameters
   * @returns LivekitRecordingResponse with stop recording results
   * @throws RecordingStopError when recording stop fails
   * @throws NoActiveRecordingsError when no active recordings found
   */
  async stopRecording(command: RecordingCommand): Promise<LivekitRecordingResponse> {
    try {
      if (!command.isStopCommand()) {
        throw new RecordingCommandError("Invalid command type for stop recording");
      }

      const summary = await this.applicationService.stopAllRecordingsForUser(
        command.subjectUserId || command.roomName,
        60
      );

      if (!summary.results || summary.results.length === 0) {
        throw new NoActiveRecordingsError("No active recordings found for this room/user");
      }

      const results: RecordingResultItem[] = summary.results.map((r) => ({
        sessionId: r.sessionId,
        egressId: r.egressId,
        status: r.status,
        blobPath: r.blobPath,
        blobUrl: r.blobUrl,
        sasUrl: r.sasUrl,
        roomName: command.roomName,
        initiatorUserId: command.initiatorUserId,
        subjectUserId: command.subjectUserId,
      }));

      return LivekitRecordingResponse.forStopCommand(
        `Recording stopped for room "${command.roomName}".`,
        command.roomName,
        results,
        results[0]?.sasUrl || undefined
      );
    } catch (error) {
      if (error instanceof NoActiveRecordingsError) {
        throw error;
      }
      throw new RecordingStopError(`Failed to stop recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
