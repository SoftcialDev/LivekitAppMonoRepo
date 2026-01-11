/**
 * @fileoverview User info store type definitions
 * @summary Type definitions for user info store state
 * @description Defines interfaces for user info store state and actions
 */

import type { UserInfo } from '../../../types';

/**
 * User information store state interface
 */
export interface IUserInfoState {
  /**
   * User information from the database, or null if not loaded
   */
  userInfo: UserInfo | null;

  /**
   * True if user info is currently being loaded
   */
  isLoading: boolean;

  /**
   * Loads user information from the database
   * 
   * Fetches user info from the API and updates both state and localStorage.
   * 
   * @returns Promise that resolves when user info is loaded
   */
  loadUserInfo: () => Promise<void>;

  /**
   * Clears user information from state and localStorage
   */
  clearUserInfo: () => void;

  /**
   * Refreshes user information from the database
   * 
   * This is useful when user roles might have changed.
   * 
   * @returns Promise that resolves when user info is refreshed
   */
  refreshUserInfo: () => Promise<void>;

  /**
   * Initializes the store by loading cached user info from localStorage
   */
  initialize: () => void;
}

