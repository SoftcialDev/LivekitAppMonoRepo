/**
 * @fileoverview usePortalPosition hook type definitions
 * @summary Type definitions for usePortalPosition hook
 */

import type { RefObject } from 'react';

export interface PortalPosition {
  top: number;
  left: number;
  width: number;
}

export interface UsePortalPositionProps {
  /**
   * Ref to the container element (input/trigger)
   */
  containerRef: RefObject<HTMLElement>;

  /**
   * Whether the dropdown is open
   */
  isOpen: boolean;

  /**
   * Whether portal rendering is enabled
   */
  usePortal: boolean;
}

export interface UsePortalPositionReturn {
  /**
   * Calculated position for the portal menu (null if not using portal or not open)
   */
  position: PortalPosition | null;
}

