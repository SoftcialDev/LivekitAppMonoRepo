/**
 * @fileoverview PSO Streaming constants
 * @summary Constants for PSO streaming module
 * @description Constants including layout options and localStorage keys
 */

import type { LayoutOption } from '../types';

/**
 * Available grid layout options for PSO video cards
 */
export const LAYOUT_OPTIONS: readonly LayoutOption[] = [1, 2, 3, 4, 5, 6, 9, 12, 20, 200] as const;

/**
 * Prefix for localStorage keys scoped by viewer email
 */
export const LS_PREFIX = 'psoDash';

/**
 * Default layout value
 */
export const DEFAULT_LAYOUT: LayoutOption = 9;

