/**
 * @fileoverview useStreamingState - manages streaming state and flags
 * @summary Centralizes streaming state management and control flags
 * @description Provides state management for streaming status, retry logic, and manual control flags
 * to prevent unwanted reconnections and manage streaming lifecycle.
 */

import { useRef, useState, useCallback } from 'react';

export interface UseStreamingStateProps {
  initialStreaming?: boolean;
}

export interface StreamingState {
  isStreaming: boolean;
  retryCount: number;
  isRetrying: boolean;
  manualStop: boolean;
}

/**
 * Hook for managing streaming state and control flags
 * 
 * @param props - Configuration for initial state
 * @returns Object containing streaming state and control functions
 */
export function useStreamingState({ initialStreaming = false }: UseStreamingStateProps = {}) {
  // Streaming state
  const [isStreaming, setIsStreaming] = useState(initialStreaming);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Control flags
  const manualStopRef = useRef<boolean>(false);
  const streamingRef = useRef<boolean>(false);
  const persistentRetryRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Sets the streaming state
   * 
   * @param streaming - Whether currently streaming
   */
  const setStreaming = useCallback((streaming: boolean) => {
    streamingRef.current = streaming;
    setIsStreaming(streaming);
  }, []);

  /**
   * Sets the manual stop flag to prevent automatic reconnection
   * 
   * @param stopped - Whether manually stopped
   */
  const setManualStop = useCallback((stopped: boolean) => {
    manualStopRef.current = stopped;
  }, []);

  /**
   * Updates retry state
   * 
   * @param retrying - Whether currently retrying
   * @param count - Current retry count
   */
  const setRetryState = useCallback((retrying: boolean, count: number = 0) => {
    setIsRetrying(retrying);
    setRetryCount(count);
  }, []);

  /**
   * Increments retry count
   */
  const incrementRetryCount = useCallback(() => {
    setRetryCount(prev => prev + 1);
  }, []);

  /**
   * Resets retry state
   */
  const resetRetryState = useCallback(() => {
    setIsRetrying(false);
    setRetryCount(0);
  }, []);

  /**
   * Sets persistent retry timeout
   * 
   * @param timeout - Timeout reference
   */
  const setPersistentRetry = useCallback((timeout: NodeJS.Timeout | null) => {
    persistentRetryRef.current = timeout;
  }, []);

  /**
   * Clears persistent retry timeout
   */
  const clearPersistentRetry = useCallback(() => {
    if (persistentRetryRef.current) {
      clearTimeout(persistentRetryRef.current);
      persistentRetryRef.current = null;
    }
  }, []);

  /**
   * Cancels all retry operations
   */
  const cancelAllRetries = useCallback(() => {
    clearPersistentRetry();
    resetRetryState();
  }, [clearPersistentRetry, resetRetryState]);

  /**
   * Gets current streaming state
   */
  const getState = useCallback((): StreamingState => ({
    isStreaming,
    retryCount,
    isRetrying,
    manualStop: manualStopRef.current
  }), [isStreaming, retryCount, isRetrying]);

  /**
   * Checks if streaming is active
   */
  const isActive = useCallback((): boolean => {
    return streamingRef.current;
  }, []);

  /**
   * Checks if manually stopped
   */
  const isManuallyStopped = useCallback((): boolean => {
    return manualStopRef.current;
  }, []);

  return {
    // State
    isStreaming,
    retryCount,
    isRetrying,
    manualStopRef,
    streamingRef,
    persistentRetryRef,
    
    // Actions
    setStreaming,
    setManualStop,
    setRetryState,
    incrementRetryCount,
    resetRetryState,
    setPersistentRetry,
    clearPersistentRetry,
    cancelAllRetries,
    
    // Getters
    getState,
    isActive,
    isManuallyStopped
  };
}
