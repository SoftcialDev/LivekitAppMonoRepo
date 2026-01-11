/**
 * @fileoverview Authentication interfaces (contracts)
 * @summary Interfaces defining authentication service contracts
 * @description Defines contracts for authentication services and contexts
 */

import type { AccountInfo, AuthenticationResult } from '@azure/msal-browser';
import type { UserInfo } from '../types';

/**
 * Authentication context value contract
 */
export interface IAuthContextValue {
  /**
   * The currently signed-in account, or null if there is no active session
   */
  account: AccountInfo | null;

  /**
   * True once MSAL has initialized and account state is set
   */
  initialized: boolean;

  /**
   * True if user is currently logged in (convenience property)
   */
  isLoggedIn?: boolean;

  /**
   * Opens a popup to sign in the user with identity scopes
   * @returns The AuthenticationResult containing id token claims
   */
  login: () => Promise<AuthenticationResult>;

  /**
   * Logs the user out via a popup and clears the local account state
   */
  logout: () => void;

  /**
   * Retrieves an access token for your API
   * Tries silently first, then falls back to a popup if interaction is required
   * @returns An access token string
   */
  getApiToken: () => Promise<string>;

  /**
   * Force-refreshes the ID token to pick up any updated roles or claims
   * @returns The AuthenticationResult with fresh id token claims
   */
  refreshRoles: () => Promise<AuthenticationResult>;
}

/**
 * User information context value contract
 */
export interface IUserInfoContextValue {
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
   * @returns Promise that resolves when user info is loaded
   */
  loadUserInfo: () => Promise<void>;

  /**
   * Clears user information from state and localStorage
   */
  clearUserInfo: () => void;

  /**
   * Refreshes user information from the database
   * @returns Promise that resolves when user info is refreshed
   */
  refreshUserInfo: () => Promise<void>;
}

