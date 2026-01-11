/**
 * @fileoverview UserInfoStore - Zustand store for managing user information
 * @summary Global state management for user information from database
 * @description Zustand store for managing user information loaded from the database.
 * Provides state management and persistence via localStorage.
 */

import { create } from 'zustand';
import { getCurrentUser } from '../../api/userInfoClient';
import { UserInfoService } from '../../services/UserInfoService';
import { logError } from '@/shared/utils/logger';
import type { IUserInfoState } from './types';
import { INITIAL_USER_INFO_STATE } from './constants';

/**
 * Zustand store for user information state management
 * 
 * Provides:
 * - Current user info from database
 * - Loading state
 * - Methods to load, clear, and refresh user info
 * - Automatic localStorage persistence
 */
export const useUserInfoStore = create<IUserInfoState>((set) => ({
  ...INITIAL_USER_INFO_STATE,

  initialize: () => {
    const storedUserInfo = UserInfoService.load();
    if (storedUserInfo) {
      set({ userInfo: storedUserInfo });
    }
  },

  loadUserInfo: async () => {
    set({ isLoading: true });
    try {
      const userData = await getCurrentUser();
      set({ userInfo: userData });
      UserInfoService.save(userData);
    } catch (error: unknown) {
      logError('Failed to load user info', { error });
      set({ userInfo: null });
      UserInfoService.clear();
    } finally {
      set({ isLoading: false });
    }
  },

  clearUserInfo: () => {
    set({ userInfo: null });
    UserInfoService.clear();
  },

  refreshUserInfo: async () => {
    const { loadUserInfo } = useUserInfoStore.getState();
    await loadUserInfo();
  },
}));

