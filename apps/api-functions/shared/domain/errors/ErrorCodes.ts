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
  INVALID_EMAIL_FORMAT = 400
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
  OPERATION_TIMEOUT = 504
}

/**
 * Supervisor management error codes
 */
export enum SupervisorErrorCode {
  SUPERVISOR_NOT_FOUND = 404,
  SUPERVISOR_NOT_ACTIVE = 400,
  SUPERVISOR_INVALID_ROLE = 400,
  USER_NOT_EMPLOYEE = 400,
  SUPERVISOR_ASSIGNMENT_FAILED = 400
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
