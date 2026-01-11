/**
 * @fileoverview useHeader - Hook for setting header information
 * @summary Hook for components/pages to set header info dynamically
 * @description Hook that sets the header when the component mounts and resets it on unmount.
 * Uses Zustand store internally, so only components that subscribe to header changes re-render.
 */

import { useEffect } from 'react';
import { useHeaderStore } from '../useHeaderStore';
import type { IHeaderInfo } from '../../../providers/types';

/**
 * Hook for components/pages to set header info
 * 
 * Sets the header to the given info when the component mounts, and resets to default on unmount.
 * Only the component that uses this hook needs to re-render, not the entire app tree.
 * 
 * @param info - HeaderInfo object containing title and optional iconSrc/iconAlt/iconNode
 * 
 * @example
 * ```ts
 * useHeader({
 *   title: 'PSOs',
 *   iconSrc: monitorIcon,
 *   iconAlt: 'PSOs',
 * })
 * ```
 * Or, with a custom ReactNode icon:
 * ```ts
 * useHeader({
 *   title: 'Ron Angel',
 *   iconNode: <UserIndicator user={...} ... />,
 * })
 * ```
 */
export function useHeader(info: IHeaderInfo): void {
  const setHeader = useHeaderStore((state) => state.setHeader);
  const resetHeader = useHeaderStore((state) => state.resetHeader);

  useEffect(() => {
    setHeader(info);
    return () => {
      // Reset to default when the component using this hook unmounts
      resetHeader();
    };
    // Re-run if any field in info changes
  }, [info.title, info.iconSrc, info.iconAlt, info.iconNode, setHeader, resetHeader]);
}

