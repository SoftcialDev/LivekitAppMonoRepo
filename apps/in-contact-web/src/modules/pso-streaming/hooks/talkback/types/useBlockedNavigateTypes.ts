/**
 * @fileoverview useBlockedNavigate hook types
 * @summary Type definitions for useBlockedNavigate hook
 * @description Types for blocking React Router navigation during active talk sessions
 */

/**
 * Enhanced navigate function with talk session blocking
 */
export interface IBlockedNavigate {
  (to: string | number, options?: { replace?: boolean; state?: unknown }): void;
  (delta: number): void;
}

