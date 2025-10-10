/**
 * @fileoverview userInfoClient - API client for user information operations
 * @description Provides functions to fetch current user information from the database
 */

import apiClient from './apiClient';

/**
 * User information interface matching the database response
 */
export interface UserInfo {
  azureAdObjectId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'Admin' | 'Supervisor' | 'Employee' | 'ContactManager' | 'SuperAdmin' | null;
  supervisorAdId?: string;
  supervisorName?: string;
}

/**
 * Fetches the current user's information from the database
 * @returns Promise that resolves to user information
 * @throws Error if the request fails
 */
export async function getCurrentUser(): Promise<UserInfo> {
  try {
    const response = await apiClient.get('/api/GetCurrentUser');
    return response.data;
  } catch (error: any) {
    const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch user information';
    throw new Error(errorMessage);
  }
}

/**
 * Refreshes the current user's information from the database
 * This is useful when user roles might have changed
 * @returns Promise that resolves to updated user information
 * @throws Error if the request fails
 */
export async function refreshUserInfo(): Promise<UserInfo> {
  return await getCurrentUser();
}
