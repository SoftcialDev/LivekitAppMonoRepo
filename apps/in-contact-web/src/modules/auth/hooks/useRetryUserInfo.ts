/**
 * @fileoverview useRetryUserInfo - Hook for loading user info with retry logic
 * @summary Custom hook that handles loading user information with automatic retries
 * @description Provides retry logic for loading user information after authentication.
 * Automatically retries failed requests at configured intervals up to a maximum time limit.
 * Returns success state, error state, and trigger function.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useUserInfoStore } from '../stores/user-info-store/useUserInfoStore';
import { setTokenGetter } from '@/shared/api/apiClient';
import { logDebug, logError } from '@/shared/utils/logger';
import type { IUseRetryUserInfoReturn } from '../types';
import {
  RETRY_INTERVAL_MS,
  MAX_RETRY_ATTEMPTS,
} from '../pages/constants';

/**
 * Custom hook for loading user information with automatic retry logic
 * 
 * Handles the loading of user information with retry logic:
 * - Configures API token getter when account is authenticated
 * - Retries every 15 seconds if the request fails
 * - Stops after 1 minute (4 attempts) and signals failure
 * - Automatically manages retry state and cleanup
 * - Prevents multiple concurrent retry attempts
 * 
 * @returns Object containing retry state, error state, and trigger function
 * 
 * @example
 * ```tsx
 * const { isRetrying, hasFailed, retryLoadUserInfo, reset } = useRetryUserInfo();
 * 
 * useEffect(() => {
 *   if (account && !isRetrying) {
 *     retryLoadUserInfo().catch(() => {
 *       // Handle failure (e.g., show error modal)
 *     });
 *   }
 * }, [account]);
 * ```
 */
export function useRetryUserInfo(): IUseRetryUserInfoReturn {
  const { account, getApiToken } = useAuth();

  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [hasFailed, setHasFailed] = useState<boolean>(false);
  const [currentAttempt, setCurrentAttempt] = useState<number>(0);
  const [error, setError] = useState<unknown | null>(null);

  const retryCountRef = useRef<number>(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const hasStartedRef = useRef<boolean>(false);
  const accountRef = useRef(account);
  const getApiTokenRef = useRef(getApiToken);

  // Keep refs in sync with latest values
  useEffect(() => {
    accountRef.current = account;
    getApiTokenRef.current = getApiToken;
  }, [account, getApiToken]);

  /**
   * Resets the retry state to initial values
   */
  const reset = useCallback((): void => {
    setIsRetrying(false);
    setHasFailed(false);
    setCurrentAttempt(0);
    setError(null);
    retryCountRef.current = 0;
    startTimeRef.current = null;
    hasStartedRef.current = false;

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  /**
   * Attempts to load user data with retry logic
   * 
   * Retries the request every 15 seconds if it fails, up to 4 attempts (1 minute total).
   * If all retries fail, sets hasFailed to true and throws the last error.
   * 
   * @returns Promise that resolves when user info is loaded successfully
   * @throws The last error encountered if all retries are exhausted
   */
  const retryLoadUserInfo = useCallback(async (): Promise<void> => {
    // Prevent multiple concurrent attempts
    if (hasStartedRef.current) {
      logDebug('Retry already in progress, skipping');
      return;
    }

    // Initialize retry session
    hasStartedRef.current = true;
    retryCountRef.current = 0;
    startTimeRef.current = Date.now();
    setIsRetrying(true);
    setHasFailed(false);
    setError(null);
    setCurrentAttempt(0);

    // Internal recursive function for retries
    const attemptLoad = async (): Promise<void> => {
      try {
        // Check if we've exceeded maximum time (1 minute)
        if (startTimeRef.current) {
          const elapsed = Date.now() - startTimeRef.current;
          if (elapsed >= 60000) {
            logDebug('Maximum retry time exceeded, stopping retries');
            hasStartedRef.current = false;
            setIsRetrying(false);
            setHasFailed(true);
            throw new Error('Maximum retry time exceeded');
          }
        }

        // Configure token getter for API requests
        if (accountRef.current) {
          setTokenGetter(getApiTokenRef.current);
        }

        // Load user information from database
        const loadUserInfo = useUserInfoStore.getState().loadUserInfo;
        await loadUserInfo();

        // Success: reset retry state
        hasStartedRef.current = false;
        setIsRetrying(false);
        retryCountRef.current = 0;
        setCurrentAttempt(0);
        setError(null);
        startTimeRef.current = null;

        if (retryTimeoutRef.current) {
          clearTimeout(retryTimeoutRef.current);
          retryTimeoutRef.current = null;
        }
      } catch (err: unknown) {
        retryCountRef.current += 1;
        setCurrentAttempt(retryCountRef.current);

        logError('Failed to load user data', {
          error: err,
          attempt: retryCountRef.current,
          maxAttempts: MAX_RETRY_ATTEMPTS,
        });

        // Check if we've reached max attempts
        if (retryCountRef.current >= MAX_RETRY_ATTEMPTS) {
          hasStartedRef.current = false;
          setIsRetrying(false);
          setHasFailed(true);
          setError(err);

          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
          }

          throw err;
        }

        // Check if we've exceeded maximum time
        if (startTimeRef.current) {
          const elapsed = Date.now() - startTimeRef.current;
          if (elapsed >= 60000) {
            hasStartedRef.current = false;
            setIsRetrying(false);
            setHasFailed(true);
            setError(err);

            if (retryTimeoutRef.current) {
              clearTimeout(retryTimeoutRef.current);
              retryTimeoutRef.current = null;
            }

            throw err;
          }
        }

        // Schedule next retry
        logDebug('Scheduling retry for user data load', {
          attempt: retryCountRef.current + 1,
          delayMs: RETRY_INTERVAL_MS,
        });

        retryTimeoutRef.current = setTimeout(() => {
          attemptLoad();
        }, RETRY_INTERVAL_MS);
      }
    };

    // Start first attempt
    attemptLoad();
  }, []); // No dependencies - use refs for account and getApiToken

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      hasStartedRef.current = false;
    };
  }, []);

  return {
    isRetrying,
    hasFailed,
    currentAttempt,
    error,
    retryLoadUserInfo,
    reset,
  };
}
