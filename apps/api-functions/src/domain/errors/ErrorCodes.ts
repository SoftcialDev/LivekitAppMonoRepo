/**
 * @fileoverview ErrorCodes - HTTP status codes for domain errors
 * @description Defines HTTP status codes for different types of failures
 */

/**
 * Authentication and authorization error codes
 */
export const AuthErrorCode = {
  CALLER_ID_NOT_FOUND: 404,
  USER_NOT_FOUND: 404,
  USER_INACTIVE: 403,
  INSUFFICIENT_PRIVILEGES: 403
} as const;

export type AuthErrorCode = typeof AuthErrorCode[keyof typeof AuthErrorCode];

/**
 * Validation error codes
 */
export const ValidationErrorCode = {
  EMPLOYEE_EMAIL_REQUIRED: 400,
  TARGET_USER_NOT_FOUND: 404,
  TARGET_NOT_EMPLOYEE: 400,
  INVALID_EMAIL_FORMAT: 400,
  INVALID_FORMAT: 400,
  SNAPSHOT_REASON_NOT_FOUND: 404,
  SNAPSHOT_REASON_INACTIVE: 400,
  DESCRIPTION_REQUIRED: 400,
  INVALID_SNAPSHOT_ID: 400,
  SNAPSHOT_REASON_ALREADY_EXISTS: 409,
  CANNOT_DEACTIVATE_OTHER_REASON: 400,
  CANNOT_DEACTIVATE_DEFAULT_REASON: 400,
  CANNOT_DELETE_OTHER_REASON: 400,
  CANNOT_DELETE_DEFAULT_REASON: 400
} as const;

export type ValidationErrorCode = typeof ValidationErrorCode[keyof typeof ValidationErrorCode];

/**
 * Messaging error codes
 */
export const MessagingErrorCode = {
  WEBSOCKET_SEND_FAILED: 400,
  SERVICE_BUS_SEND_FAILED: 400,
  MESSAGING_SERVICE_UNAVAILABLE: 503,
  COMMAND_DELIVERY_FAILED: 400
} as const;

export type MessagingErrorCode = typeof MessagingErrorCode[keyof typeof MessagingErrorCode];

/**
 * Application logic error codes
 */
export const ApplicationErrorCode = {
  COMMAND_PROCESSING_FAILED: 500,
  BUSINESS_RULE_VIOLATION: 400,
  OPERATION_TIMEOUT: 504,
  CONTACT_MANAGER_FORM_PROCESSING_FAILED: 500,
  SNAPSHOT_PROCESSING_FAILED: 500,
  OPERATION_FAILED: 500
} as const;

export type ApplicationErrorCode = typeof ApplicationErrorCode[keyof typeof ApplicationErrorCode];

/**
 * Supervisor management error codes
 */
export const SupervisorErrorCode = {
  SUPERVISOR_NOT_FOUND: 404,
  SUPERVISOR_NOT_ACTIVE: 400,
  SUPERVISOR_INVALID_ROLE: 400,
  USER_NOT_EMPLOYEE: 400,
  SUPERVISOR_ASSIGNMENT_FAILED: 400,
  PSO_NOT_FOUND: 404,
  PSO_FETCH_FAILED: 500
} as const;

export type SupervisorErrorCode = typeof SupervisorErrorCode[keyof typeof SupervisorErrorCode];

/**
 * User role change error codes
 */
export const UserRoleChangeErrorCode = {
  GRAPH_TOKEN_FAILED: 500,
  USER_NOT_FOUND_IN_GRAPH: 404,
  SERVICE_PRINCIPAL_NOT_FOUND: 500,
  ROLE_ASSIGNMENT_FAILED: 500,
  ROLE_REMOVAL_FAILED: 500,
  INSUFFICIENT_PERMISSIONS: 403,
  INVALID_ROLE_ASSIGNMENT: 400
} as const;

export type UserRoleChangeErrorCode = typeof UserRoleChangeErrorCode[keyof typeof UserRoleChangeErrorCode];

/**
 * User deletion error codes
 */
export const UserDeletionErrorCode = {
  USER_NOT_FOUND: 404,
  USER_ALREADY_DELETED: 400,
  GRAPH_TOKEN_FAILED: 500,
  ROLE_REMOVAL_FAILED: 500,
  DATABASE_DELETION_FAILED: 500,
  INSUFFICIENT_PERMISSIONS: 403,
  INVALID_DELETION_TYPE: 400,
  SERVICE_PRINCIPAL_NOT_FOUND: 500
} as const;

export type UserDeletionErrorCode = typeof UserDeletionErrorCode[keyof typeof UserDeletionErrorCode];

/**
 * User query error codes
 */
export const UserQueryErrorCode = {
  INVALID_ROLE_PARAMETER: 400,
  INVALID_PAGINATION: 400,
  DATABASE_QUERY_FAILED: 500,
  INSUFFICIENT_PERMISSIONS: 403,
  INVALID_QUERY_PARAMETERS: 400
} as const;

export type UserQueryErrorCode = typeof UserQueryErrorCode[keyof typeof UserQueryErrorCode];

/**
 * Snapshot error codes
 */
export const SnapshotErrorCode = {
  SNAPSHOT_NOT_FOUND: 404,
  SNAPSHOT_DELETION_FAILED: 500,
  SNAPSHOT_CREATION_FAILED: 500,
  SNAPSHOT_PROCESSING_FAILED: 500,
  IMAGE_UPLOAD_FAILED: 500,
  INVALID_SNAPSHOT_DATA: 400
} as const;

export type SnapshotErrorCode = typeof SnapshotErrorCode[keyof typeof SnapshotErrorCode];

/**
 * Contact Manager error codes
 */
export const ContactManagerErrorCode = {
  USER_NOT_FOUND: 404,
  PROFILE_NOT_FOUND: 404,
  FORM_PROCESSING_FAILED: 500,
  INVALID_PROFILE_DATA: 400
} as const;

export type ContactManagerErrorCode = typeof ContactManagerErrorCode[keyof typeof ContactManagerErrorCode];

/**
 * Command error codes
 */
export const CommandErrorCode = {
  USER_NOT_FOUND: 404,
  USER_DELETED: 400,
  INVALID_USER_ROLE: 400,
  COMMAND_NOT_FOUND: 404,
  COMMAND_ACKNOWLEDGMENT_FAILED: 500
} as const;

export type CommandErrorCode = typeof CommandErrorCode[keyof typeof CommandErrorCode];

/**
 * Entity validation error codes
 */
export const EntityValidationErrorCode = {
  MISSING_REQUIRED_FIELDS: 400,
  INVALID_FORMAT: 400,
  INVALID_PERMISSION_CODE: 400
} as const;

export type EntityValidationErrorCode = typeof EntityValidationErrorCode[keyof typeof EntityValidationErrorCode];

/**
 * Supervisor transfer error codes
 */
export const SupervisorTransferErrorCode = {
  INVALID_ROLE: 403,
  OPERATION_FAILED: 500
} as const;

export type SupervisorTransferErrorCode = typeof SupervisorTransferErrorCode[keyof typeof SupervisorTransferErrorCode];

/**
 * General operation error codes
 */
export const OperationErrorCode = {
  OPERATION_FAILED: 500,
  DATABASE_OPERATION_FAILED: 500,
  INVALID_INPUT: 400,
  INVARIANT_VIOLATION: 500,
  MISSING_REQUIRED_DATA: 400
} as const;

export type OperationErrorCode = typeof OperationErrorCode[keyof typeof OperationErrorCode];

/**
 * Error log error codes
 */
export const ErrorLogErrorCode = {
  NO_IDS_PROVIDED: 400,
  OPERATION_FAILED: 500
} as const;

export type ErrorLogErrorCode = typeof ErrorLogErrorCode[keyof typeof ErrorLogErrorCode];

/**
 * Camera failure error codes
 */
export const CameraFailureErrorCode = {
  RETRIEVE_FAILED: 500,
  COUNT_FAILED: 500
} as const;

export type CameraFailureErrorCode = typeof CameraFailureErrorCode[keyof typeof CameraFailureErrorCode];

/**
 * SuperAdmin error codes
 */
export const SuperAdminErrorCode = {
  USER_NOT_FOUND: 404,
  INVALID_ROLE: 400
} as const;

export type SuperAdminErrorCode = typeof SuperAdminErrorCode[keyof typeof SuperAdminErrorCode];

/**
 * Infrastructure error codes
 */
export const InfrastructureErrorCode = {
  CONFIGURATION_ERROR: 500,
  BLOB_STORAGE_UPLOAD_FAILED: 500,
  BLOB_STORAGE_DOWNLOAD_FAILED: 500,
  BLOB_STORAGE_DELETE_FAILED: 500,
  CHAT_SERVICE_FAILED: 500,
  CHAT_NO_PARTICIPANTS: 400,
  CHAT_INVALID_PARTICIPANTS: 400,
  WEBPUBSUB_TOKEN_FAILED: 500,
  WEBPUBSUB_BROADCAST_FAILED: 500,
  WEBPUBSUB_SYNC_FAILED: 500,
  LIVEKIT_OPERATION_FAILED: 500,
  GRAPH_SERVICE_FAILED: 500,
  ENCRYPTION_FAILED: 500,
  STORAGE_CREDENTIALS_FAILED: 500,
  SERVICE_NOT_FOUND: 500
} as const;

export type InfrastructureErrorCode = typeof InfrastructureErrorCode[keyof typeof InfrastructureErrorCode];

/**
 * Repository error codes
 */
export const RepositoryErrorCode = {
  DATABASE_QUERY_FAILED: 500,
  ENTITY_NOT_FOUND: 404,
  ENTITY_CREATION_FAILED: 500,
  ENTITY_UPDATE_FAILED: 500,
  ENTITY_DELETION_FAILED: 500,
  PSO_FETCH_FAILED: 500,
  SUPERVISOR_FETCH_FAILED: 500,
  STREAMING_SESSION_FETCH_FAILED: 500
} as const;

export type RepositoryErrorCode = typeof RepositoryErrorCode[keyof typeof RepositoryErrorCode];

/**
 * Middleware error codes
 */
export const MiddlewareErrorCode = {
  CALLER_ID_NOT_FOUND: 401,
  TARGET_USER_NOT_FOUND: 404,
  TARGET_USER_INACTIVE: 400,
  TARGET_NOT_PSO: 400,
  INSUFFICIENT_PRIVILEGES: 403,
  ADMIN_ACCESS_REQUIRED: 403,
  SUPER_ADMIN_ACCESS_REQUIRED: 403
} as const;

export type MiddlewareErrorCode = typeof MiddlewareErrorCode[keyof typeof MiddlewareErrorCode];

/**
 * Application service error codes
 */
export const ApplicationServiceErrorCode = {
  RECORDING_SESSION_NOT_FOUND: 404,
  OPERATION_FAILED: 500
} as const;

export type ApplicationServiceErrorCode = typeof ApplicationServiceErrorCode[keyof typeof ApplicationServiceErrorCode];

/**
 * Talk session error codes
 */
export const TalkSessionErrorCode = {
  TALK_SESSION_ALREADY_ACTIVE: 409
} as const;

export type TalkSessionErrorCode = typeof TalkSessionErrorCode[keyof typeof TalkSessionErrorCode];