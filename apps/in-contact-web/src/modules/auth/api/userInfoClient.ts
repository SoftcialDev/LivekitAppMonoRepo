/**
 * @fileoverview userInfoClient - API client for user information operations
 * @summary Provides functions to fetch current user information from the database
 * @description API client for fetching and refreshing user information from the backend
 */

import apiClient from '@/shared/api/apiClient';
import type { UserInfo } from '../types';
import { logError } from '@/shared/utils/logger';
import { ApiError } from '@/shared/errors';

/**
 * Fetches the current user's information from the database
 * 
 * @returns Promise that resolves to user information
 * @throws Error if the request fails
 * 
 * @example
 * ```ts
 * try {
 *   const userInfo = await getCurrentUser();
 *   console.log('User:', userInfo.email, userInfo.role);
 * } catch (error) {
 *   console.error('Failed to fetch user info:', error);
 * }
 * ```
 */
export async function getCurrentUser(): Promise<UserInfo> {
  try {
    const response = await apiClient.get<UserInfo>('/api/GetCurrentUser');
    return response.data;
  } catch (error: unknown) {
    logError('Failed to fetch user information', { error });
    
    // If it's already an ApiError, re-throw it
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Otherwise wrap it in ApiError
    throw new ApiError(
      'Failed to fetch user information. Please try again later.',
      undefined,
      undefined,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Refreshes the current user's information from the database
 * 
 * This is useful when user roles might have changed.
 * 
 * @returns Promise that resolves to updated user information
 * @throws Error if the request fails
 * 
 * @example
 * ```ts
 * try {
 *   const updatedUserInfo = await refreshUserInfo();
 *   console.log('Updated user:', updatedUserInfo);
 * } catch (error) {
 *   console.error('Failed to refresh user info:', error);
 * }
 * ```
 */
export async function refreshUserInfo(): Promise<UserInfo> {
  return await getCurrentUser();
}

