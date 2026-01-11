/**
 * @fileoverview Types for useStreamCommandHandling hook
 * @summary Type definitions for stream command handling hook
 */

/**
 * Options for useStreamCommandHandling hook
 */
export interface IUseStreamCommandHandlingOptions {
  /** PSO email address for filtering commands */
  userEmail: string;
  /** Callback to start streaming */
  onStartCommand: () => Promise<void>;
  /** Callback to stop streaming */
  onStopCommand: (reason?: string) => Promise<void>;
}

