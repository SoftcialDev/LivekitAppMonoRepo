/**
 * @fileoverview useVideoCardOptimization hook
 * @summary Hook for optimizing VideoCard performance
 * @description Avoids unnecessary re-renders by maintaining stable handler references
 */

import { useCallback, useRef } from 'react';

/**
 * Hook for optimizing VideoCard performance
 * Avoids unnecessary re-renders by maintaining stable handler references
 * 
 * @returns Object with functions to create stable handlers
 */
export function useVideoCardOptimization() {
  const stableHandlersRef = useRef<Map<string, any>>(new Map());

  /**
   * Creates a stable handler for onToggle that doesn't change between renders
   * @param email - PSO email
   * @param isLive - Whether currently streaming
   * @param onToggle - Toggle function
   * @returns Stable toggle handler
   */
  const createStableToggleHandler = useCallback((
    email: string, 
    isLive: boolean, 
    onToggle: (email: string, reason?: string) => void
  ) => {
    const key = `${email}-toggle-${isLive}`;
    
    if (!stableHandlersRef.current.has(key)) {
      const handler = (emailParam: string, reason?: string) => {
        onToggle(emailParam, reason);
      };
      stableHandlersRef.current.set(key, handler);
    }
    
    return stableHandlersRef.current.get(key);
  }, []);

  /**
   * Creates a stable handler for onChat that doesn't change between renders
   * @param email - PSO email
   * @param onChat - Chat function
   * @returns Stable chat handler
   */
  const createStableChatHandler = useCallback((
    email: string,
    onChat: (email: string) => Promise<void>
  ) => {
    const key = `chat-${email}`;
    
    if (!stableHandlersRef.current.has(key)) {
      stableHandlersRef.current.set(key, () => onChat(email));
    }
    
    return stableHandlersRef.current.get(key);
  }, []);

  /**
   * Cleans up obsolete handlers to prevent memory leaks
   */
  const cleanup = useCallback(() => {
    stableHandlersRef.current.clear();
  }, []);

  return {
    createStableToggleHandler,
    createStableChatHandler,
    cleanup
  };
}

