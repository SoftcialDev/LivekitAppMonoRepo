/**
 * @fileoverview UserInfoService - Service for managing user information in localStorage
 * @description Provides methods to save, load, and clear user information from localStorage
 */

import { UserInfo } from '../api/userInfoClient';

/**
 * Service for managing user information in localStorage
 */
export class UserInfoService {
  private static readonly STORAGE_KEY = 'userInfo';

  /**
   * Saves user information to localStorage
   * @param userInfo - The user information to save
   */
  static save(userInfo: UserInfo): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userInfo));
    } catch (error) {
      console.error('Failed to save user info to localStorage:', error);
    }
  }

  /**
   * Loads user information from localStorage
   * @returns The user information or null if not found
   */
  static load(): UserInfo | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load user info from localStorage:', error);
      return null;
    }
  }

  /**
   * Clears user information from localStorage
   */
  static clear(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear user info from localStorage:', error);
    }
  }

  /**
   * Checks if user information exists in localStorage
   * @returns True if user info exists, false otherwise
   */
  static hasUserInfo(): boolean {
    return this.load() !== null;
  }
}

