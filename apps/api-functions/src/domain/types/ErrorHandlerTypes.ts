/**
 * Configuration options for error handler middleware.
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

