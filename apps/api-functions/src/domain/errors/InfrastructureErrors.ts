/**
 * @fileoverview InfrastructureErrors - Infrastructure layer error classes
 * @description Specific error classes for infrastructure operations
 */

import { DomainError } from './DomainError';
import { InfrastructureErrorCode } from './ErrorCodes';

/**
 * Configuration error
 */
export class ConfigurationError extends DomainError {
  constructor(message: string) {
    super(message, InfrastructureErrorCode.CONFIGURATION_ERROR);
  }
}

/**
 * Blob storage upload error
 */
export class BlobStorageUploadError extends DomainError {
  constructor(message: string, cause?: Error) {
    super(message, InfrastructureErrorCode.BLOB_STORAGE_UPLOAD_FAILED);
    if (cause) {
      this.cause = cause;
    }
  }
}

/**
 * Blob storage download error
 */
export class BlobStorageDownloadError extends DomainError {
  constructor(message: string, cause?: Error) {
    super(message, InfrastructureErrorCode.BLOB_STORAGE_DOWNLOAD_FAILED);
    if (cause) {
      this.cause = cause;
    }
  }
}

/**
 * Blob storage delete error
 */
export class BlobStorageDeleteError extends DomainError {
  constructor(message: string, cause?: Error) {
    super(message, InfrastructureErrorCode.BLOB_STORAGE_DELETE_FAILED);
    if (cause) {
      this.cause = cause;
    }
  }
}

/**
 * Chat service error
 */
export class ChatServiceError extends DomainError {
  constructor(message: string, cause?: Error) {
    super(message, InfrastructureErrorCode.CHAT_SERVICE_FAILED);
    if (cause) {
      this.cause = cause;
    }
  }
}

/**
 * Chat no participants error
 */
export class ChatNoParticipantsError extends DomainError {
  constructor(message: string) {
    super(message, InfrastructureErrorCode.CHAT_NO_PARTICIPANTS);
  }
}

/**
 * Chat invalid participants error
 */
export class ChatInvalidParticipantsError extends DomainError {
  constructor(message: string) {
    super(message, InfrastructureErrorCode.CHAT_INVALID_PARTICIPANTS);
  }
}

/**
 * WebPubSub token generation error
 */
export class WebPubSubTokenError extends DomainError {
  constructor(message: string, cause?: Error) {
    super(message, InfrastructureErrorCode.WEBPUBSUB_TOKEN_FAILED);
    if (cause) {
      this.cause = cause;
    }
  }
}

/**
 * WebPubSub broadcast error
 */
export class WebPubSubBroadcastError extends DomainError {
  constructor(message: string, cause?: Error) {
    super(message, InfrastructureErrorCode.WEBPUBSUB_BROADCAST_FAILED);
    if (cause) {
      this.cause = cause;
    }
  }
}

/**
 * WebPubSub sync error
 */
export class WebPubSubSyncError extends DomainError {
  constructor(message: string, cause?: Error) {
    super(message, InfrastructureErrorCode.WEBPUBSUB_SYNC_FAILED);
    if (cause) {
      this.cause = cause;
    }
  }
}

/**
 * LiveKit operation error
 */
export class LiveKitOperationError extends DomainError {
  constructor(message: string, cause?: Error) {
    super(message, InfrastructureErrorCode.LIVEKIT_OPERATION_FAILED);
    if (cause) {
      this.cause = cause;
    }
  }
}

/**
 * Graph service error
 */
export class GraphServiceError extends DomainError {
  constructor(message: string, cause?: Error) {
    super(message, InfrastructureErrorCode.GRAPH_SERVICE_FAILED);
    if (cause) {
      this.cause = cause;
    }
  }
}

/**
 * Encryption error
 */
export class EncryptionError extends DomainError {
  constructor(message: string, cause?: Error) {
    super(message, InfrastructureErrorCode.ENCRYPTION_FAILED);
    if (cause) {
      this.cause = cause;
    }
  }
}

/**
 * Storage credentials error
 */
export class StorageCredentialsError extends DomainError {
  constructor(message: string, cause?: Error) {
    super(message, InfrastructureErrorCode.STORAGE_CREDENTIALS_FAILED);
    if (cause) {
      this.cause = cause;
    }
  }
}

/**
 * Service not found error
 */
export class ServiceNotFoundError extends DomainError {
  constructor(message: string) {
    super(message, InfrastructureErrorCode.SERVICE_NOT_FOUND);
  }
}

