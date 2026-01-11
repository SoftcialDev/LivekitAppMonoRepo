/**
 * @fileoverview usePortalPosition hook
 * @summary Hook for calculating portal menu position
 * @description Calculates the position of a dropdown menu when rendered in a portal
 */

import { useState, useEffect } from 'react';
import type {
  PortalPosition,
  UsePortalPositionProps,
  UsePortalPositionReturn,
} from './types/usePortalPositionTypes';

/**
 * Hook for calculating portal menu position
 * 
 * Calculates the position of a dropdown menu when rendered in a portal based on
 * the container element's bounding rectangle. Returns null if portal is disabled
 * or dropdown is not open.
 * 
 * @param props - Hook configuration
 * @returns Object with calculated position
 * 
 * @example
 * ```typescript
 * const containerRef = useRef<HTMLDivElement>(null);
 * const { position } = usePortalPosition({
 *   containerRef,
 *   isOpen: true,
 *   usePortal: true,
 * });
 * // position: { top: 100, left: 50, width: 200 }
 * ```
 */
export function usePortalPosition({
  containerRef,
  isOpen,
  usePortal,
}: UsePortalPositionProps): UsePortalPositionReturn {
  const [position, setPosition] = useState<PortalPosition | null>(null);

  useEffect(() => {
    if (!usePortal || !isOpen || !containerRef.current) {
      setPosition(null);
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    setPosition({
      top: rect.bottom,
      left: rect.left,
      width: rect.width,
    });
  }, [isOpen, usePortal, containerRef]);

  return { position };
}

