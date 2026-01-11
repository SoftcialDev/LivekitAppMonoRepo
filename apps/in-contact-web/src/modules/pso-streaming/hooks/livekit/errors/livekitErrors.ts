/**
 * @fileoverview LiveKit errors
 * @summary Domain-specific error classes for LiveKit operations
 * @description Error classes for LiveKit room connection and track management
 */

import { PSOStreamingError } from '../../../errors/psoStreamingErrors';

/**
 * Error thrown when LiveKit room connection fails
 */
export class LiveKitConnectionError extends PSOStreamingError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'LiveKitConnectionError';
  }
}

/**
 * Error thrown when LiveKit track operations fail
 */
export class LiveKitTrackError extends PSOStreamingError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'LiveKitTrackError';
  }
}

