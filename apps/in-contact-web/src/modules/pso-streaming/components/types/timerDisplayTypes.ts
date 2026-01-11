/**
 * @fileoverview TimerDisplay component types
 * @summary Type definitions for TimerDisplay component
 * @description Interfaces and types for TimerDisplay component props
 */

import type { TimerInfo } from '../../types';

/**
 * Props for TimerDisplay component
 */
export interface ITimerDisplayProps {
  timerInfo: TimerInfo | null;
  className?: string;
  showLabel?: boolean;
}

/**
 * Props for CompactTimer component
 */
export interface ICompactTimerProps {
  timerInfo: TimerInfo | null;
}

