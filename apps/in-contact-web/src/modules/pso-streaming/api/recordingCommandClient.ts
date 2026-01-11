/**
 * @fileoverview Recording command API client
 * @summary API client for LiveKit recording commands
 * @description Provides functions to start and stop LiveKit recordings
 */

import apiClient from '@/shared/api/apiClient';
import { handleApiError } from '@/shared/utils/errorUtils';
import type {
  RecordingCommandRequest,
  RecordingCommandResponse,
} from './types/recordingCommandClientTypes';

/**
 * Sends a recording command to the backend
 * 
 * @param payload - Recording command request
 * @returns Promise that resolves with the command response
 * @throws {Error} If the API request fails
 */
export async function sendRecordingCommand(
  payload: RecordingCommandRequest
): Promise<RecordingCommandResponse> {
  try {
    const response = await apiClient.post<RecordingCommandResponse>('/api/recording', payload);
    return response.data;
  } catch (error) {
    throw handleApiError(
      'send recording command',
      error,
      'Failed to send recording command'
    );
  }
}

/**
 * Starts recording for a LiveKit room
 * 
 * @param roomName - Name of the LiveKit room to start recording
 * @returns Promise that resolves with the command response
 * @throws {Error} If the API request fails
 */
export async function startRecording(roomName: string): Promise<RecordingCommandResponse> {
  return sendRecordingCommand({ command: 'START', roomName });
}

/**
 * Stops recording for a LiveKit room
 * 
 * @param roomName - Name of the LiveKit room to stop recording
 * @returns Promise that resolves with the command response
 * @throws {Error} If the API request fails
 */
export async function stopRecording(roomName: string): Promise<RecordingCommandResponse> {
  return sendRecordingCommand({ command: 'STOP', roomName });
}

