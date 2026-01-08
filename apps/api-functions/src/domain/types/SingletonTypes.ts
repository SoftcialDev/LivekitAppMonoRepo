/**
 * @fileoverview SingletonTypes - Type definitions for singleton configuration
 * @summary Type definitions for singleton-related data structures
 * @description Pure data structures for singleton proxy configuration
 */

/**
 * Options for configuring the lazy singleton proxy
 * @description Configuration options for customizing proxy behavior
 */
export interface LazySingletonProxyOptions {
  /**
   * Optional function to reset the singleton instance (useful for testing)
   * @description Called when reset() is invoked on the proxy
   */
  reset?: () => void;
}

