/**
 * @fileoverview Timer constants
 * @summary Constants for timer functionality
 * @description Duration constants, color mappings, and label mappings for timers
 */

import { TimerType, TimerColor } from '../enums';
import { StreamingStopReason } from '../enums';

/**
 * Duration for each timer type in minutes
 */
export const TIMER_DURATIONS = {
  [TimerType.QUICK_BREAK]: 5,
  [TimerType.SHORT_BREAK]: 15,
  [TimerType.LUNCH_BREAK]: 30,
  [TimerType.EMERGENCY]: 0, // No limit for emergency
  [TimerType.DISCONNECT]: 0, // No limit for disconnect
} as const;

/**
 * Mapping from StreamingStopReason to TimerType
 */
export const STOP_REASON_TO_TIMER_TYPE: Record<StreamingStopReason, TimerType | null> = {
  [StreamingStopReason.QUICK_BREAK]: TimerType.QUICK_BREAK,
  [StreamingStopReason.SHORT_BREAK]: TimerType.SHORT_BREAK,
  [StreamingStopReason.LUNCH_BREAK]: TimerType.LUNCH_BREAK,
  [StreamingStopReason.EMERGENCY]: TimerType.EMERGENCY,
  [StreamingStopReason.COMMAND]: null,
  [StreamingStopReason.DISCONNECT]: TimerType.DISCONNECT,
  [StreamingStopReason.END_OF_SHIFT]: null,
} as const;

/**
 * Labels for each timer type
 */
export const TIMER_LABELS: Record<TimerType, string> = {
  [TimerType.LUNCH_BREAK]: 'Lunch',
  [TimerType.SHORT_BREAK]: 'Short Break',
  [TimerType.QUICK_BREAK]: 'Quick Break',
  [TimerType.EMERGENCY]: 'Emergency',
  [TimerType.DISCONNECT]: 'Disconnect',
} as const;

/**
 * CSS classes for timer colors (full display with background)
 */
export const TIMER_COLOR_CLASSES: Record<TimerColor, string> = {
  [TimerColor.GREEN]: 'text-green-500 bg-green-100',
  [TimerColor.YELLOW]: 'text-yellow-600 bg-yellow-100',
  [TimerColor.RED]: 'text-red-600 bg-red-100',
} as const;

/**
 * CSS classes for timer colors (compact display without background)
 */
export const TIMER_COLOR_CLASSES_COMPACT: Record<TimerColor, string> = {
  [TimerColor.GREEN]: 'text-green-500',
  [TimerColor.YELLOW]: 'text-yellow-600',
  [TimerColor.RED]: 'text-red-600',
} as const;

/**
 * Thresholds for color changes (in seconds)
 */
export const TIMER_COLOR_THRESHOLDS = {
  RED_THRESHOLD: 60, // Last minute
  YELLOW_THRESHOLD: 300, // Last 5 minutes
} as const;

