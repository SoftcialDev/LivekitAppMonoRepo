/**
 * @fileoverview Navigation utilities
 * @summary Utility functions for navigation interception
 * @description Utility functions for intercepting and blocking navigation attempts
 */

import { logDebug } from './logger';

/**
 * Creates a click handler that intercepts navigation when conditions are met
 * 
 * @param options - Configuration options for the handler
 * @returns Event handler function
 */
export function createNavigationClickHandler(options: {
  hasActiveSessions: () => boolean;
  currentPathname: string;
  onBlockNavigation: (href: string) => void;
  logPrefix?: string;
}): (e: MouseEvent) => void {
  const { hasActiveSessions, currentPathname, onBlockNavigation, logPrefix = 'NavigationGuard' } = options;

  return (e: MouseEvent): void => {
    const target = e.target as HTMLElement;
    const anchor = target.closest('a[href]') as HTMLAnchorElement;
    
    if (!anchor) {
      return;
    }

    const href = anchor.getAttribute('href');
    if (!href?.startsWith('/')) {
      // External link or non-navigation link
      return;
    }

    // Check if there are active talk sessions
    if (hasActiveSessions() && href !== currentPathname) {
      // Block navigation
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      // Trigger callback to store pending navigation and show modal
      onBlockNavigation(href);
      logDebug(`[${logPrefix}] Blocking navigation due to active talk session`, { href });
    }
  };
}

