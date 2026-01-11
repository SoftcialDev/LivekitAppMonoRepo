/**
 * @fileoverview Types for useAutoReloadWhenIdle hook
 * @summary Type definitions for auto-reload utility hook
 */

/**
 * Options for useAutoReloadWhenIdle hook
 */
export interface IUseAutoReloadWhenIdleOptions {
  /**
   * Interval in milliseconds between reload attempts
   * @default 120000 (2 minutes)
   */
  intervalMs?: number;

  /**
   * Whether to reload only when the page is visible
   * @default false
   */
  onlyWhenVisible?: boolean;
}

