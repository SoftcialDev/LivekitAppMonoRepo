/**
 * @fileoverview useSidebarNavigation hook
 * @summary Hook for managing sidebar navigation links
 * @description Provides helper functions for rendering navigation links with disabled state handling
 */

import React, { useMemo, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { IMPLEMENTED_ROUTES, SIDEBAR_LINK_CLASSES } from '../constants/sidebarConstants';
import type { IUseSidebarNavigationReturn } from '../types';

/**
 * Hook for managing sidebar navigation
 *
 * Provides helper functions for rendering navigation links that are automatically
 * disabled if the route is not in the implemented routes list.
 *
 * @returns Object with navigation rendering helper
 *
 * @example
 * ```typescript
 * const { renderNavLink } = useSidebarNavigation();
 * 
 * return (
 *   <>
 *     {renderNavLink('/dashboard', 'Dashboard')}
 *     {renderNavLink('/admin', 'Admin')}
 *   </>
 * );
 * ```
 */
export function useSidebarNavigation(): IUseSidebarNavigationReturn {
  // Create Set of implemented routes for fast lookup
  const implementedRoutesSet = useMemo(
    () => new Set<string>(IMPLEMENTED_ROUTES),
    []
  );

  /**
   * Renders a navigation link, disabled if route doesn't exist
   */
  const renderNavLink = useCallback(
    (to: string, children: React.ReactNode, disabled: boolean = false): React.ReactNode => {
      if (disabled || !implementedRoutesSet.has(to)) {
        return React.createElement(
          'span',
          {
            key: to,
            className: SIDEBAR_LINK_CLASSES.DISABLED,
            title: 'This page is not yet implemented',
          },
          children
        );
      }

      return React.createElement(
        NavLink,
        {
          key: to,
          to,
          className: ({ isActive }: { isActive: boolean }) =>
            `${SIDEBAR_LINK_CLASSES.BASE} ${isActive ? SIDEBAR_LINK_CLASSES.ACTIVE : ''}`,
        },
        children
      );
    },
    [implementedRoutesSet]
  );

  return { renderNavLink };
}
