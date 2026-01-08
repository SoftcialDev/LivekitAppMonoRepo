/**
 * @fileoverview FunctionNames - Constants for Azure Function names
 * @summary Defines all Azure Function names used in the application
 * @description Centralizes function names to avoid magic strings throughout the codebase
 */

/**
 * Azure Function names used in error logging and monitoring
 * @description These names correspond to the actual Azure Function names defined in the project
 */
export const FunctionNames = {
  /**
   * LiveKit recording function name
   * @description Used for recording session management and error logging
   */
  LIVEKIT_RECORDING: 'LivekitRecordingFunction',

  /**
   * WebPubSub events function name
   * @description Used for WebSocket connection/disconnection event logging
   */
  WEBPUBSUB_EVENTS: 'WebPubSubEvents',

  /**
   * Run migrations function name
   * @description Used for database migration execution
   */
  RUN_MIGRATIONS: 'RunMigrations',

  /**
   * Get snapshot reasons function name
   * @description Used for retrieving snapshot reason options
   */
  GET_SNAPSHOT_REASONS: 'GetSnapshotReasons'
} as const;

