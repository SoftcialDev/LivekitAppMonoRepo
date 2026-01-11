/**
 * @fileoverview useClickOutsideMultiple hook type definitions
 * @summary Type definitions for useClickOutsideMultiple hook
 */

import type { RefObject } from 'react';

export interface UseClickOutsideMultipleProps {
  /**
   * Array of refs to elements that should be considered "inside"
   */
  refs: Array<RefObject<HTMLElement>>;

  /**
   * Callback function to execute when click outside is detected
   */
  handler: () => void;

  /**
   * Whether the hook is enabled
   * 
   * @default true
   */
  enabled?: boolean;
}

