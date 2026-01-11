/**
 * @fileoverview Countdown types
 * @summary Type definitions for countdown utilities
 * @description Interfaces for countdown callback management
 */

/**
 * Callbacks for countdown management
 */
export interface ICountdownCallbacks {
  onCountdownUpdate: (value: number | null) => void;
  onCountdownStart: () => void;
  onCountdownEnd: () => void;
  onComplete: () => Promise<void>;
}

