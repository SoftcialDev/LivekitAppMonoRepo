/**
 * @fileoverview ErrorSource - Enumeration for error source identification
 * @description Defines sources where errors can originate from
 */

/**
 * Error source identification for categorizing where errors occur
 */
export enum ErrorSource {
  /** Errors originating from chat service operations (Microsoft Graph API) */
  ChatService = 'ChatService',
  /** Errors originating from blob storage operations */
  BlobStorage = 'BlobStorage',
  /** Errors originating from database operations */
  Database = 'Database',
  /** Errors originating from authentication/authorization */
  Authentication = 'Authentication',
  /** Errors originating from input validation */
  Validation = 'Validation',
  /** Errors originating from WebPubSub/WebSocket operations */
  WebPubSub = 'WebPubSub',
  /** Errors originating from LiveKit recording operations */
  Recording = 'Recording',
  /** Unknown or unclassified error source */
  Unknown = 'Unknown'
}

