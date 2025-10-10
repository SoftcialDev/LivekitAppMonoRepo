/**
 * @fileoverview UserInfoContext - Context for managing user information from database
 * @description Provides user information state and methods to load/clear user data
 */

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { UserInfo, getCurrentUser } from '../api/userInfoClient';
import { UserInfoService } from '../services/UserInfoService';
import { setTokenGetter } from '../api/apiClient';

interface UserInfoContextValue {
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

export const UserInfoContext = createContext<UserInfoContextValue>({
  userInfo: null,
  isLoading: false,
  loadUserInfo: async () => {},
  clearUserInfo: () => {},
  refreshUserInfo: async () => {},
});

/**
 * Provider for UserInfoContext
 */
export const UserInfoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Loads user information from localStorage on mount
   */
  useEffect(() => {
    const storedUserInfo = UserInfoService.load();
    if (storedUserInfo) {
      setUserInfo(storedUserInfo);
    }
  }, []);

  /**
   * Loads user information from the database
   */
  const loadUserInfo = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const userData = await getCurrentUser();
      setUserInfo(userData);
      UserInfoService.save(userData);
    } catch (error) {
      console.error('Failed to load user info:', error);
      setUserInfo(null);
      UserInfoService.clear();
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Clears user information from state and localStorage
   */
  const clearUserInfo = (): void => {
    setUserInfo(null);
    UserInfoService.clear();
  };

  /**
   * Refreshes user information from the database
   */
  const refreshUserInfo = async (): Promise<void> => {
    await loadUserInfo();
  };

  return (
    <UserInfoContext.Provider value={{
      userInfo,
      isLoading,
      loadUserInfo,
      clearUserInfo,
      refreshUserInfo
    }}>
      {children}
    </UserInfoContext.Provider>
  );
};

