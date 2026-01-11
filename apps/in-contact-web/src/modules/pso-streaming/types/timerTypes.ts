/**
 * @fileoverview Timer type definitions
 * @summary Type definitions for timer functionality
 * @description Defines interfaces for timer display and management
 */

import { TimerType, TimerColor } from '../enums';

/**
 * Timer information structure
 */
export interface TimerInfo {
  type: TimerType;
  duration: number; // in minutes
  remainingTime: number; // in seconds
  isExpired: boolean;
  isNegative: boolean;
  displayTime: string; // formatted time (MM:SS or +MM:SS)
  color: TimerColor;
}

