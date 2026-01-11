/**
 * @fileoverview Authentication type definitions
 * @summary Type definitions for authentication-related data structures
 * @description Defines types for user information, authentication results, and related data structures
 */

import type { AccountInfo, AuthenticationResult } from '@azure/msal-browser';
import { UserRole } from '../enums';

/**
 * User information from the database
 */
export interface UserInfo {
  /**
   * Azure AD object ID
   */
  azureAdObjectId: string;

  /**
   * User email address
   */
  email: string;

  /**
   * User first name
   */
  firstName: string;

  /**
   * User last name
   */
  lastName: string;

  /**
   * User role in the system
   */
  role: UserRole | null;

  /**
   * Supervisor Azure AD ID (optional, for PSOs)
   */
  supervisorAdId?: string;

  /**
   * Supervisor name (optional, for PSOs)
   */
  supervisorName?: string;

  /**
   * Array of permission codes assigned to the user
   */
  permissions: string[];
}

/**
 * User status for presence/streaming
 */
export interface UserStatus {
  /**
   * Azure AD object ID
   */
  azureAdObjectId: any;

  /**
   * Online/offline status
   */
  status: string;

  /**
   * User full name
   */
  fullName: string;

  /**
   * User email address
   */
  email: string;

  /**
   * User display name
   */
  name: string;

  /**
   * Last seen timestamp (optional)
   */
  lastSeenAt?: string;

  /**
   * User role (optional)
   */
  role?: UserRole;

  /**
   * Contact manager status (optional)
   */
  cmStatus?: string;

  /**
   * Supervisor ID (optional)
   */
  supervisorId?: string | null;

  /**
   * Supervisor email (optional)
   */
  supervisorEmail?: string | null;
}

/**
 * Hook return type for useRetryUserInfo
 * 
 * Defines the structure of values returned by the useRetryUserInfo hook.
 * Provides retry state, error state, and trigger/reset functions.
 */
export interface IUseRetryUserInfoReturn {
  /**
   * Whether the retry operation is currently in progress
   */
  isRetrying: boolean;

  /**
   * Whether all retry attempts have failed
   */
  hasFailed: boolean;

  /**
   * Current retry attempt number (1-indexed)
   */
  currentAttempt: number;

  /**
   * Error that occurred during the last failed attempt
   */
  error: unknown | null;

  /**
   * Function to trigger the user info loading with retry logic
   * 
   * @returns Promise that resolves when user info is loaded successfully,
   * or rejects after all retry attempts have been exhausted
   */
  retryLoadUserInfo: () => Promise<void>;

  /**
   * Function to reset the retry state
   */
  reset: () => void;
}

