/**
 * @fileoverview UserInfoService - Service for managing user information in localStorage
 * @summary Provides methods to save, load, and clear user information from localStorage
 * @description Service for persisting user information in browser localStorage
 */

import type { UserInfo } from '../types';
import { logError } from '@/shared/utils/logger';

/**
 * Service for managing user information in localStorage
 * 
 * Provides static methods to persist user information across page reloads.
 * Uses a single storage key to store serialized user data.
 */
export class UserInfoService {
  private static readonly STORAGE_KEY = 'userInfo';

  /**
   * Saves user information to localStorage
   * 
   * @param userInfo - The user information to save
   * 
   * @example
   * ```ts
   * UserInfoService.save(userInfo);
   * ```
   */
  static save(userInfo: UserInfo): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userInfo));
    } catch (error: unknown) {
      logError('Failed to save user info to localStorage', { error });
    }
  }

  /**
   * Loads user information from localStorage
   * 
   * @returns The user information or null if not found or invalid
   * 
   * @example
   * ```ts
   * const userInfo = UserInfoService.load();
   * if (userInfo) {
   *   console.log('Loaded user:', userInfo.email);
   * }
   * ```
   */
  static load(): UserInfo | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? (JSON.parse(stored) as UserInfo) : null;
    } catch (error: unknown) {
      logError('Failed to load user info from localStorage', { error });
      return null;
    }
  }

  /**
   * Clears user information from localStorage
   * 
   * @example
   * ```ts
   * UserInfoService.clear();
   * ```
   */
  static clear(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error: unknown) {
      logError('Failed to clear user info from localStorage', { error });
    }
  }

  /**
   * Checks if user information exists in localStorage
   * 
   * @returns True if user info exists, false otherwise
   * 
   * @example
   * ```ts
   * if (UserInfoService.hasUserInfo()) {
   *   console.log('User info is cached');
   * }
   * ```
   */
  static hasUserInfo(): boolean {
    return this.load() !== null;
  }
}

