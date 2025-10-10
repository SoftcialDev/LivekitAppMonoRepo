/**
 * @fileoverview useUserInfo - Hook for accessing user information context
 * @description Provides access to user information state and methods
 */

import { useContext } from 'react';
import { UserInfoContext } from '../contexts/UserInfoContext';

/**
 * Hook for accessing user information context
 * @returns User information context value
 */
export const useUserInfo = () => {
  const context = useContext(UserInfoContext);
  
  if (!context) {
    throw new Error('useUserInfo must be used within a UserInfoProvider');
  }
  
  return context;
};

