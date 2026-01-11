/**
 * @fileoverview Microphone track utilities
 * @summary Helper functions for managing microphone tracks
 * @description Utilities for publishing, unpublishing, and cleaning up microphone tracks
 */

import type { Room, LocalAudioTrack } from 'livekit-client';
import { createLocalAudioTrack } from 'livekit-client';
import { TalkbackMicrophonePublishError, TalkbackRoomNotConnectedError } from '../../../errors';

/**
 * Publishes a microphone track to a LiveKit room
 * 
 * @param room - The LiveKit room to publish to
 * @param existingTrack - Optional existing track to reuse
 * @returns Promise resolving to the published track
 * @throws {TalkbackRoomNotConnectedError} If room is not connected
 * @throws {TalkbackMicrophonePublishError} If publishing fails
 */
export async function publishMicrophoneTrack(
  room: Room,
  existingTrack: LocalAudioTrack | null
): Promise<LocalAudioTrack> {
  if (!room) {
    throw new TalkbackRoomNotConnectedError('Room is not connected');
  }

  if (existingTrack) {
    try {
      await room.localParticipant.publishTrack(existingTrack);
      return existingTrack;
    } catch {
      // ignore duplicate publish
      return existingTrack;
    }
  }

  try {
    const track = await createLocalAudioTrack();
    await room.localParticipant.publishTrack(track);
    return track;
  } catch (error) {
    throw new TalkbackMicrophonePublishError(
      'Failed to publish microphone track',
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Unpublishes and stops a microphone track
 * 
 * @param room - The LiveKit room (optional, for unpublishing)
 * @param track - The track to stop
 * @param stopOnUnpublish - Whether to stop the underlying MediaStreamTrack when unpublishing
 */
export function cleanupMicrophoneTrack(
  room: Room | null,
  track: LocalAudioTrack | null,
  stopOnUnpublish: boolean
): void {
  if (room && track) {
    try {
      room.localParticipant.unpublishTrack(track, stopOnUnpublish);
    } catch {
      // ignore unpublish errors
    }
  }

  if (track) {
    try {
      track.stop();
    } catch {
      // ignore stop errors
    }
  }
}

