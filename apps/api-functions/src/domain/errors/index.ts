/**
 * @fileoverview Error exports - Centralized exports for all domain errors
 * @description Provides a single import point for all domain errors
 */

// Base error class
export { DomainError, AuthError, ValidationError, MessagingError, ApplicationError, SupervisorError, UserRoleChangeError, UserDeletionError } from './DomainError';

// Error codes
export * from './ErrorCodes';

// Specific error classes
export { UserNotFoundError, UserAccessDeniedError } from './UserErrors';
export { SnapshotNotFoundError, SnapshotReasonNotFoundError, SnapshotReasonInactiveError, DescriptionRequiredError, SnapshotReasonAlreadyExistsError, SnapshotProcessingError, CannotDeactivateOtherReasonError, CannotDeactivateDefaultReasonError, CannotDeleteOtherReasonError, CannotDeleteDefaultReasonError } from './SnapshotErrors';
export { ContactManagerUserNotFoundError, ContactManagerProfileNotFoundError, ContactManagerFormProcessingError } from './ContactManagerErrors';
export { CommandUserNotFoundError, CommandUserDeletedError, CommandInvalidUserRoleError, CommandNotFoundError } from './CommandErrors';
export { MissingRequiredFieldsError, InvalidFormatError, InvalidPermissionCodeError } from './EntityValidationErrors';
export { NoErrorLogIdsProvidedError } from './ErrorLogErrors';
export { CameraFailureRetrieveError, CameraFailureCountError } from './CameraFailureErrors';
export { SuperAdminUserNotFoundError, SuperAdminInvalidRoleError } from './SuperAdminErrors';
export * from './RecordingErrors';
export * from './StreamingSessionErrors';
export * from './PendingCommandErrors';
export { ConfigurationError, BlobStorageUploadError, BlobStorageDownloadError, BlobStorageDeleteError, ChatServiceError, ChatNoParticipantsError, ChatInvalidParticipantsError, WebPubSubTokenError, WebPubSubBroadcastError, WebPubSubSyncError, LiveKitOperationError, GraphServiceError, EncryptionError, StorageCredentialsError, ServiceNotFoundError } from './InfrastructureErrors';
export { DatabaseQueryError, EntityNotFoundError, EntityCreationError, EntityUpdateError, EntityDeletionError, PsoFetchError, SupervisorFetchError, StreamingSessionFetchError } from './RepositoryErrors';
export { CallerIdNotFoundError, TargetUserNotFoundError, TargetUserInactiveError, TargetNotPsoError, InsufficientPrivilegesError, AdminAccessRequiredError, SuperAdminAccessRequiredError } from './MiddlewareErrors';
export { RecordingSessionNotFoundError, ApplicationServiceOperationError } from './ApplicationServiceErrors';
export { TalkSessionAlreadyActiveError } from './TalkSessionErrors';

