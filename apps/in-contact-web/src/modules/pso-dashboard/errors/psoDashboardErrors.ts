/**
 * @fileoverview PSO Dashboard errors
 * @summary Domain-specific error classes for PSO Dashboard operations
 * @description Error classes for PSO Dashboard module following domain error patterns
 */

import { AppError } from '@/shared/errors';

/**
 * Base error class for PSO Dashboard operations
 */
export class PSODashboardError extends AppError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'PSODashboardError';
  }
}

/**
 * Error thrown when supervisor fetch fails
 */
export class SupervisorFetchError extends PSODashboardError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'SupervisorFetchError';
  }
}

/**
 * Error thrown when streaming setup fails
 */
export class StreamingSetupError extends PSODashboardError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'StreamingSetupError';
  }
}

