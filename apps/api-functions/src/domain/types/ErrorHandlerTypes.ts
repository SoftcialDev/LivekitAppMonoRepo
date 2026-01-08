/**
 * @fileoverview ErrorHandlerTypes - Type definitions for error handler middleware
 * @summary Type definitions for error handler configuration options
 * @description Pure data structures for error handler middleware configuration
 */

/**
 * Configuration options for error handler middleware
 * @description Defines options for customizing error handler behavior
 */
export interface ErrorHandlerOptions {
  /**
   * Message for 500 errors. Defaults to "Internal Server Error".
   */
  genericMessage?: string;

  /**
   * Include stack trace in non-production. Defaults to false.
   */
  showStackInDev?: boolean;

  /**
   * Production check function. Defaults to checking config.node_env.
   */
  isProd?: () => boolean;
}

