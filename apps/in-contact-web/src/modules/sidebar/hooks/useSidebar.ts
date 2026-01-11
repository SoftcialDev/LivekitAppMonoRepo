/**
 * @fileoverview useSidebar hook
 * @summary Hook for managing sidebar state
 * @description Provides sidebar collapse state management
 */

import { useState, useCallback } from 'react';

/**
 * Hook for managing sidebar collapse state
 * 
 * @returns Sidebar state and toggle function
 * 
 * @example
 * ```typescript
 * const { isCollapsed, toggleCollapse } = useSidebar();
 * ```
 */
export function useSidebar() {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const toggleCollapse = useCallback((): void => {
    setIsCollapsed((prev) => !prev);
  }, []);

  return {
    isCollapsed,
    toggleCollapse,
  };
}

