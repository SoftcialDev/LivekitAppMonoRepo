/**
 * @fileoverview RepositoryErrors - Repository layer error classes
 * @description Specific error classes for repository operations
 */

import { DomainError } from './DomainError';
import { RepositoryErrorCode } from './ErrorCodes';

/**
 * Database query error
 */
export class DatabaseQueryError extends DomainError {
  constructor(message: string, cause?: Error) {
    super(message, RepositoryErrorCode.DATABASE_QUERY_FAILED);
    if (cause) {
      this.cause = cause;
    }
  }
}

/**
 * Entity not found error
 */
export class EntityNotFoundError extends DomainError {
  constructor(message: string) {
    super(message, RepositoryErrorCode.ENTITY_NOT_FOUND);
  }
}

/**
 * Entity creation error
 */
export class EntityCreationError extends DomainError {
  constructor(message: string, cause?: Error) {
    super(message, RepositoryErrorCode.ENTITY_CREATION_FAILED);
    if (cause) {
      this.cause = cause;
    }
  }
}

/**
 * Entity update error
 */
export class EntityUpdateError extends DomainError {
  constructor(message: string, cause?: Error) {
    super(message, RepositoryErrorCode.ENTITY_UPDATE_FAILED);
    if (cause) {
      this.cause = cause;
    }
  }
}

/**
 * Entity deletion error
 */
export class EntityDeletionError extends DomainError {
  constructor(message: string, cause?: Error) {
    super(message, RepositoryErrorCode.ENTITY_DELETION_FAILED);
    if (cause) {
      this.cause = cause;
    }
  }
}

/**
 * PSO fetch error
 */
export class PsoFetchError extends DomainError {
  constructor(message: string, cause?: Error) {
    super(message, RepositoryErrorCode.PSO_FETCH_FAILED);
    if (cause) {
      this.cause = cause;
    }
  }
}

/**
 * Supervisor fetch error
 */
export class SupervisorFetchError extends DomainError {
  constructor(message: string, cause?: Error) {
    super(message, RepositoryErrorCode.SUPERVISOR_FETCH_FAILED);
    if (cause) {
      this.cause = cause;
    }
  }
}

/**
 * Streaming session fetch error
 */
export class StreamingSessionFetchError extends DomainError {
  constructor(message: string, cause?: Error) {
    super(message, RepositoryErrorCode.STREAMING_SESSION_FETCH_FAILED);
    if (cause) {
      this.cause = cause;
    }
  }
}

