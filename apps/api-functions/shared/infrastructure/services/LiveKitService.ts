/**
 * @fileoverview LiveKitService - Infrastructure service for LiveKit operations
 * @summary Handles LiveKit room management and token generation
 * @description Infrastructure service that implements LiveKit operations using the LiveKit SDK
 */

import { RoomServiceClient, AccessToken } from 'livekit-server-sdk';
import { ILiveKitService } from '../../domain/interfaces/ILiveKitService';
import { config } from '../../config';

/**
 * Error thrown when a LiveKit service operation fails unexpectedly
 * @description Wraps the original error and exposes any HTTP status code or details
 */
export class LiveKitServiceError extends Error {
  /** HTTP status code returned by the LiveKit API, if available */
  public readonly code?: number;
  /** Any additional error details or payload */
  public readonly details?: unknown;

  /**
   * Creates a new LiveKitServiceError
   * @param message - Human-readable description of what went wrong
   * @param code - HTTP status code (e.g. 500, 404) if returned by LiveKit
   * @param details - Raw error payload or object for deeper inspection
   */
  constructor(message: string, code?: number, details?: unknown) {
    super(message);
    this.name = 'LiveKitServiceError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Infrastructure service for LiveKit operations
 * @description Handles LiveKit room management and token generation using the LiveKit SDK
 */
export class LiveKitService implements ILiveKitService {
  private adminClient: RoomServiceClient;

  /**
   * Creates a new LiveKitService instance
   */
  constructor() {
    this.adminClient = new RoomServiceClient(
      config.livekitApiUrl,
      config.livekitApiKey,
      config.livekitApiSecret
    );
  }

  /**
   * Ensures that a LiveKit room exists with no auto-delete timeout
   * @param roomName - The unique name for the room to create or verify
   * @returns Promise that resolves once the room is ensured to exist
   * @throws LiveKitServiceError for any error other than HTTP 409
   */
  async ensureRoom(roomName: string): Promise<void> {
    console.debug(`[LiveKit] ensureRoom: creating room "${roomName}"`);
    try {
      await this.adminClient.createRoom({ name: roomName, emptyTimeout: 0 });
      console.info(`[LiveKit] ensureRoom: room "${roomName}" created`);
    } catch (err: any) {
      const code = err.code ?? err.statusCode ?? err.status;
      if (code === 409) {
        console.warn(`[LiveKit] ensureRoom: room "${roomName}" already exists (409)`);
        return;
      }
      console.error(`[LiveKit] ensureRoom: unexpected error for "${roomName}"`, {
        message: err.message,
        code,
        details: err.data ?? err.details ?? err,
      });
      throw new LiveKitServiceError(
        `Failed to ensure room "${roomName}": ${err.message}`,
        code,
        err,
      );
    }
  }

  /**
   * Retrieves a list of all existing LiveKit rooms
   * @returns Promise that resolves to an array of room names
   * @throws LiveKitServiceError if the operation fails
   */
  async listRooms(): Promise<string[]> {
    console.debug('[LiveKit] listRooms: fetching rooms');
    try {
      const rooms = await this.adminClient.listRooms();
      console.info(`[LiveKit] listRooms: retrieved ${rooms.length} rooms`);
      return rooms.map(r => r.name ?? r.sid);
    } catch (err: any) {
      const code = err.code ?? err.statusCode ?? err.status;
      console.error('[LiveKit] listRooms: failed to fetch rooms', {
        message: err.message,
        code,
        details: err,
      });
      throw new LiveKitServiceError(
        `Failed to list rooms: ${err.message}`,
        code,
        err,
      );
    }
  }

  /**
   * Generates a JWT access token for a participant to join a LiveKit room
   * @param identity - A unique identifier for the user
   * @param isAdmin - Whether to grant admin-level permissions (audio only publishing)
   * @param room - The name or ID of the room the token applies to
   * @returns Promise that resolves to the signed JWT access token
   * @throws LiveKitServiceError when token generation fails
   */
  async generateToken(identity: string, isAdmin: boolean, room: string): Promise<string> {
    console.debug(
      `[LiveKit] generateToken: identity=${identity}, isAdmin=${isAdmin}, room=${room}`
    );
    try {
      const at = new AccessToken(
        config.livekitApiKey,
        config.livekitApiSecret,
        { identity },
      );

      const grant: any = {
        roomJoin: true,
        room,
        canSubscribe: true,
        canPublish: true,
        canPublishData: true,
        publishSources: isAdmin
          ? ['microphone'] // Admin can only publish audio
          : ['camera', 'microphone', 'screen_share', 'screen_share_audio'],
      };

      at.addGrant(grant);

      const token = await at.toJwt();
      console.info('[LiveKit] generateToken: token generated successfully');
      return token;
    } catch (err: any) {
      console.error('[LiveKit] generateToken: failed to create token', {
        message: err.message,
        details: err,
      });
      throw new LiveKitServiceError(
        `Failed to generate token for "${identity}": ${err.message}`,
        undefined,
        err,
      );
    }
  }
}
