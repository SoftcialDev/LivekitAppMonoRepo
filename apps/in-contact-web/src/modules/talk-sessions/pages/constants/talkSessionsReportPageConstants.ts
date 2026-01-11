/**
 * @fileoverview Constants for Talk Sessions Report page
 * @summary Cell styling constants for talk sessions report columns
 * @description Centralized constants for cell className configurations
 */

/**
 * Cell className constants for talk sessions report columns
 */
export const TALK_SESSIONS_REPORT_CELL_CLASSES = {
  /**
   * Cell className for supervisor and PSO columns (font semibold, max width, wrap break word)
   */
  NAME_COLUMN: 'font-semibold max-w-[200px] wrap-break-word whitespace-normal',

  /**
   * Cell className for date/time columns (whitespace nowrap)
   */
  DATE_TIME: 'whitespace-nowrap',

  /**
   * Cell className for stop reason column (max width, wrap break word)
   */
  STOP_REASON: 'max-w-[180px] wrap-break-word whitespace-normal',
} as const;

