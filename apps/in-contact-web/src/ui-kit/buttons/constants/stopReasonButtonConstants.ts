/**
 * @fileoverview StopReasonButton constants
 * @summary Constants for StopReasonButton component
 * @description Constants for stop reason options and styling
 */

import { StreamingStopReason } from '@/modules/pso-streaming/enums/streamingStopReason';
import type { StopReasonOption } from '../types/stopReasonButtonTypes';

/**
 * Available stop reason options with labels and descriptions
 */
export const STOP_REASON_OPTIONS: StopReasonOption[] = [
  {
    value: StreamingStopReason.QUICK_BREAK,
    label: 'Quick',
    description: '5 minutes',
  },
  {
    value: StreamingStopReason.SHORT_BREAK,
    label: 'Short',
    description: '15 minutes',
  },
  {
    value: StreamingStopReason.LUNCH_BREAK,
    label: 'Lunch',
    description: '30 minutes',
  },
  {
    value: StreamingStopReason.EMERGENCY,
    label: 'Emergency',
    description: 'Urgent matter',
  },
  {
    value: StreamingStopReason.END_OF_SHIFT,
    label: 'End of Shift',
    description: 'End of work day',
  },
];

/**
 * Minimum width for the dropdown menu
 */
export const DROPDOWN_MIN_WIDTH = '200px';

/**
 * Vertical offset between button and dropdown
 */
export const DROPDOWN_OFFSET_TOP = 5;

