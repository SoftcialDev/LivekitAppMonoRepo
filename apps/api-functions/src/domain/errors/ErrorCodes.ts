/**
 * @fileoverview ErrorCodes - HTTP status codes for domain errors
 * @description Defines HTTP status codes for different types of failures
 */

/**
 * Authentication and authorization error codes
 */
export enum AuthErrorCode {
  CALLER_ID_NOT_FOUND = 404,
  USER_NOT_FOUND = 404,
  USER_INACTIVE = 403,
  INSUFFICIENT_PRIVILEGES = 403
}

/**
 * Validation error codes
 */
export enum ValidationErrorCode {
  EMPLOYEE_EMAIL_REQUIRED = 400,
  TARGET_USER_NOT_FOUND = 404,
  TARGET_NOT_EMPLOYEE = 400,
  INVALID_EMAIL_FORMAT = 400,
  INVALID_FORMAT = 400,
  SNAPSHOT_REASON_NOT_FOUND = 404,
  SNAPSHOT_REASON_INACTIVE = 400,
  DESCRIPTION_REQUIRED = 400,
  INVALID_SNAPSHOT_ID = 400,
  SNAPSHOT_REASON_ALREADY_EXISTS = 409,
  CANNOT_DEACTIVATE_OTHER_REASON = 400,
  CANNOT_DEACTIVATE_DEFAULT_REASON = 400,
  CANNOT_DELETE_OTHER_REASON = 400,
  CANNOT_DELETE_DEFAULT_REASON = 400
}

/**
 * Messaging error codes
 */
export enum MessagingErrorCode {
  WEBSOCKET_SEND_FAILED = 400,
  SERVICE_BUS_SEND_FAILED = 400,
  MESSAGING_SERVICE_UNAVAILABLE = 503,
  COMMAND_DELIVERY_FAILED = 400
}

/**
 * Application logic error codes
 */
export enum ApplicationErrorCode {
  COMMAND_PROCESSING_FAILED = 500,
  BUSINESS_RULE_VIOLATION = 400,
  OPERATION_TIMEOUT = 504,
  CONTACT_MANAGER_FORM_PROCESSING_FAILED = 500,
  SNAPSHOT_PROCESSING_FAILED = 500,
  OPERATION_FAILED = 500
}

/**
 * Supervisor management error codes
 */
export enum SupervisorErrorCode {
  SUPERVISOR_NOT_FOUND = 404,
  SUPERVISOR_NOT_ACTIVE = 400,
  SUPERVISOR_INVALID_ROLE = 400,
  USER_NOT_EMPLOYEE = 400,
  SUPERVISOR_ASSIGNMENT_FAILED = 400,
  PSO_NOT_FOUND = 404,
  PSO_FETCH_FAILED = 500
}

/**
 * User role change error codes
 */
export enum UserRoleChangeErrorCode {
  GRAPH_TOKEN_FAILED = 500,
  USER_NOT_FOUND_IN_GRAPH = 404,
  SERVICE_PRINCIPAL_NOT_FOUND = 500,
  ROLE_ASSIGNMENT_FAILED = 500,
  ROLE_REMOVAL_FAILED = 500,
  INSUFFICIENT_PERMISSIONS = 403,
  INVALID_ROLE_ASSIGNMENT = 400
}

/**
 * User deletion error codes
 */
export enum UserDeletionErrorCode {
  USER_NOT_FOUND = 404,
  USER_ALREADY_DELETED = 400,
  GRAPH_TOKEN_FAILED = 500,
  ROLE_REMOVAL_FAILED = 500,
  DATABASE_DELETION_FAILED = 500,
  INSUFFICIENT_PERMISSIONS = 403,
  INVALID_DELETION_TYPE = 400,
  SERVICE_PRINCIPAL_NOT_FOUND = 500
}

/**
 * User query error codes
 */
export enum UserQueryErrorCode {
  INVALID_ROLE_PARAMETER = 400,
  INVALID_PAGINATION = 400,
  DATABASE_QUERY_FAILED = 500,
  INSUFFICIENT_PERMISSIONS = 403,
  INVALID_QUERY_PARAMETERS = 400
}

/**
 * Snapshot error codes
 */
export enum SnapshotErrorCode {
  SNAPSHOT_NOT_FOUND = 404,
  SNAPSHOT_DELETION_FAILED = 500,
  SNAPSHOT_CREATION_FAILED = 500,
  SNAPSHOT_PROCESSING_FAILED = 500,
  IMAGE_UPLOAD_FAILED = 500,
  INVALID_SNAPSHOT_DATA = 400
}

/**
 * Contact Manager error codes
 */
export enum ContactManagerErrorCode {
  USER_NOT_FOUND = 404,
  PROFILE_NOT_FOUND = 404,
  FORM_PROCESSING_FAILED = 500,
  INVALID_PROFILE_DATA = 400
}

/**
 * Command error codes
 */
export enum CommandErrorCode {
  USER_NOT_FOUND = 404,
  USER_DELETED = 400,
  INVALID_USER_ROLE = 400,
  COMMAND_NOT_FOUND = 404,
  COMMAND_ACKNOWLEDGMENT_FAILED = 500
}

/**
 * Entity validation error codes
 */
export enum EntityValidationErrorCode {
  MISSING_REQUIRED_FIELDS = 400,
  INVALID_FORMAT = 400,
  INVALID_PERMISSION_CODE = 400
}

/**
 * Supervisor transfer error codes
 */
export enum SupervisorTransferErrorCode {
  INVALID_ROLE = 403,
  OPERATION_FAILED = 500
}

/**
 * General operation error codes
 */
export enum OperationErrorCode {
  OPERATION_FAILED = 500,
  DATABASE_OPERATION_FAILED = 500,
  INVALID_INPUT = 400,
  INVARIANT_VIOLATION = 500,
  MISSING_REQUIRED_DATA = 400
}

/**
 * Error log error codes
 */
export enum ErrorLogErrorCode {
  NO_IDS_PROVIDED = 400,
  OPERATION_FAILED = 500
}

/**
 * Camera failure error codes
 */
export enum CameraFailureErrorCode {
  RETRIEVE_FAILED = 500,
  COUNT_FAILED = 500
}

/**
 * SuperAdmin error codes
 */
export enum SuperAdminErrorCode {
  USER_NOT_FOUND = 404,
  INVALID_ROLE = 400
}

/**
 * Infrastructure error codes
 */
export enum InfrastructureErrorCode {
  CONFIGURATION_ERROR = 500,
  BLOB_STORAGE_UPLOAD_FAILED = 500,
  BLOB_STORAGE_DOWNLOAD_FAILED = 500,
  BLOB_STORAGE_DELETE_FAILED = 500,
  CHAT_SERVICE_FAILED = 500,
  CHAT_NO_PARTICIPANTS = 400,
  CHAT_INVALID_PARTICIPANTS = 400,
  WEBPUBSUB_TOKEN_FAILED = 500,
  WEBPUBSUB_BROADCAST_FAILED = 500,
  WEBPUBSUB_SYNC_FAILED = 500,
  LIVEKIT_OPERATION_FAILED = 500,
  GRAPH_SERVICE_FAILED = 500,
  ENCRYPTION_FAILED = 500,
  STORAGE_CREDENTIALS_FAILED = 500,
  SERVICE_NOT_FOUND = 500
}

/**
 * Repository error codes
 */
export enum RepositoryErrorCode {
  DATABASE_QUERY_FAILED = 500,
  ENTITY_NOT_FOUND = 404,
  ENTITY_CREATION_FAILED = 500,
  ENTITY_UPDATE_FAILED = 500,
  ENTITY_DELETION_FAILED = 500,
  PSO_FETCH_FAILED = 500,
  SUPERVISOR_FETCH_FAILED = 500,
  STREAMING_SESSION_FETCH_FAILED = 500
}

/**
 * Middleware error codes
 */
export enum MiddlewareErrorCode {
  CALLER_ID_NOT_FOUND = 401,
  TARGET_USER_NOT_FOUND = 404,
  TARGET_USER_INACTIVE = 400,
  TARGET_NOT_PSO = 400,
  INSUFFICIENT_PRIVILEGES = 403,
  ADMIN_ACCESS_REQUIRED = 403,
  SUPER_ADMIN_ACCESS_REQUIRED = 403
}

/**
 * Application service error codes
 */
export enum ApplicationServiceErrorCode {
  RECORDING_SESSION_NOT_FOUND = 404,
  OPERATION_FAILED = 500
}

/**
 * Talk session error codes
 */
export enum TalkSessionErrorCode {
  TALK_SESSION_ALREADY_ACTIVE = 409
}