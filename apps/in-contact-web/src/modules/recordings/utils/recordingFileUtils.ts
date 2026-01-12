/**
 * @fileoverview Recording file utilities
 * @summary Utilities specific to recording file operations
 * @description Helper functions for formatting duration, generating recording file names, and handling recording downloads
 */

import { downloadFile, sanitizeFileName } from '@/shared/utils/fileUtils';
import { RecordingDownloadUrlError } from '../errors';
import type { RecordingReport } from '../types/recordingTypes';

/**
 * Formats seconds into human-readable duration format
 * 
 * Formats duration as `H:MM:SS` if hours > 0, otherwise `MM:SS`.
 * 
 * @param totalSeconds - Duration in seconds
 * @returns Formatted duration string (e.g., "1:23:45" or "23:45")
 */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = m.toString().padStart(2, '0');
  const ss = sec.toString().padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/**
 * Generates a descriptive file name for recording download
 * 
 * Creates a human-readable file name with format:
 * `recording_{roomName}_{date}_{time}_{shortId}.mp4`
 * 
 * @param recording - Recording report containing room name and startedAt date
 * @returns Formatted file name
 */
export function generateRecordingFileName(recording: RecordingReport): string {
  const roomName = sanitizeFileName(
    recording.roomName || recording.username || 'unknown',
    20
  );

  // Format date and time from startedAt
  const startedAt = recording.startedAt ? new Date(recording.startedAt) : new Date();
  const dateStr = startedAt.toISOString().slice(0, 10).replaceAll('-', '');
  const hours = String(startedAt.getUTCHours()).padStart(2, '0');
  const minutes = String(startedAt.getUTCMinutes()).padStart(2, '0');
  const seconds = String(startedAt.getUTCSeconds()).padStart(2, '0');
  const timeStr = `${hours}${minutes}${seconds}`;

  // Get last 6 characters of recording ID for uniqueness
  const shortId = recording.id.slice(-6);

  return `recording_${roomName}_${dateStr}_${timeStr}_${shortId}.mp4`;
}

/**
 * Downloads a recording video
 * 
 * Downloads the recording video from the playback URL or blob URL with a
 * descriptive file name generated from the recording metadata.
 * 
 * @param recording - Recording report containing playback/blob URL and metadata
 * @returns Promise that resolves when download completes or rejects on error
 * @throws {RecordingDownloadUrlError} If no playback or blob URL is available
 * @throws {Error} If the download fails (thrown by downloadFile)
 */
export async function downloadRecording(recording: RecordingReport): Promise<void> {
  const url = recording.playbackUrl || recording.blobUrl;
  if (!url) {
    throw new RecordingDownloadUrlError(recording.id);
  }
  
  const fileName = generateRecordingFileName(recording);
  await downloadFile(url, fileName);
}

