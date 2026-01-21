/**
 * @fileoverview PSO Streaming constants
 * @summary Constants for PSO streaming module
 * @description Constants including layout options and localStorage keys
 */

import type { LayoutOption } from '../types';

/**
 * Available grid layout options for PSO video cards
 * Options from 1 to 10, then 12, 15, 20, plus "All" (-1) to show all PSOs
 */
export const LAYOUT_OPTIONS: readonly LayoutOption[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, -1] as const;

/**
 * Prefix for localStorage keys scoped by viewer email
 */
export const LS_PREFIX = 'psoDash';

/**
 * Default layout value
 */
export const DEFAULT_LAYOUT: LayoutOption = -1; // "All" - show all PSOs by default

