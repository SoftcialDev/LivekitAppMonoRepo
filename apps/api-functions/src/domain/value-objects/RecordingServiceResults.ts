/**
 * @fileoverview RecordingServiceResults - Value objects for recording service operation results
 * @summary Defines result types for recording start/stop operations
 * @description Provides structured result types for LiveKit recording service operations
 */

import { RecordingStartStatus } from '../enums/RecordingStartStatus';
import { RecordingStopStatus } from '../enums/RecordingStopStatus';

/**
 * Result of starting a recording session
 */
export interface RecordingStartResult {
  sessionId: string;
  egressId: string;
  status: RecordingStartStatus;
  blobPath: string;
  blobUrl: string;
}

/**
 * Result of stopping a recording session
 */
export interface RecordingStopResult {
  sessionId: string;
  egressId: string;
  status: RecordingStopStatus;
  blobPath?: string;
  blobUrl?: string;
  sasUrl?: string;
  roomName: string;
  initiatorUserId: string;
  subjectUserId?: string | null;
}

/**
 * Summary of recording operations
 */
export interface RecordingSummary {
  results: RecordingStopResult[];
}

