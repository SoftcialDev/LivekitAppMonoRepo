/**
 * @fileoverview ApiEndpoints - Constants for API endpoint paths
 * @summary Defines all API endpoint paths used in the application
 * @description Centralizes endpoint paths to avoid magic strings throughout the codebase
 */

/**
 * API endpoint paths used in error logging and request routing
 * @description These paths correspond to the actual API routes defined in Azure Functions
 */
export const ApiEndpoints = {
  /**
   * Recording endpoint
   * @description Used for recording session operations
   */
  RECORDING: '/api/recording',

  /**
   * Run migrations endpoint
   * @description Used for database migration execution
   */
  RUN_MIGRATIONS: '/api/RunMigrations',

  /**
   * Get snapshot reasons endpoint
   * @description Used for retrieving snapshot reason options
   */
  GET_SNAPSHOT_REASONS: '/api/GetSnapshotReasons',

  /**
   * WebPubSub events endpoint
   * @description Used for WebSocket connection/disconnection events
   */
  WEBPUBSUB_EVENTS: '/api/webpubsub-events'
} as const;

